// 1) Paste your Firebase web-app config here (Firebase console > Project settings > Your apps).
const FIREBASE_CONFIG = {
apiKey: "AIzaSyBxVpl3kl_MX4pkukbX4VZB16-4ZLT9RE0",
  authDomain: "dance-scoreboard.firebaseapp.com",
  databaseURL: "https://dance-scoreboard-default-rtdb.firebaseio.com",
  projectId: "dance-scoreboard",
  storageBucket: "dance-scoreboard.firebasestorage.app",
  messagingSenderId: "24558645087",
  appId: "1:24558645087:web:a6827269dda231860850ea"
  
};

// 2) Nothing below needs editing.
const Store = (() => {
  const code = (new URLSearchParams(location.search).get('e') || '').replace(/[^A-Za-z0-9_-]/g, '');
  let ref = null, state = null, online = false, err = '';
  const listeners = [];
  const emit = () => listeners.forEach(f => f());
  const norm = v => {
    v = v || {};
    const sc = v.scores || {};
    return {
      performer: v.performer || '',
      round: v.round || 0,
      revealed: !!v.revealed,
      showBoard: v.showBoard !== false,
      scores: [sc.j1, sc.j2, sc.j3].map(x => x === undefined ? null : x),
      history: Object.values(v.history || {}).sort((a, b) => a.at - b.at)
    };
  };
  const w = p => Promise.resolve(p).then(
    () => { if (err) { err = ''; emit(); } },
    e => { err = (e && e.message) || String(e); emit(); });
  if (code) {
    firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.database();
    ref = db.ref('events/' + code);
    ref.on('value', snap => { state = norm(snap.val()); emit(); });
    db.ref('.info/connected').on('value', s => { online = !!s.val(); emit(); });
  }
  return {
    code, build: '3',
    get error() { return err; },
    get state() { return state; },
    get online() { return online; },
    onChange(f) { listeners.push(f); },
    score(j, n) { return w(ref.child('scores/j' + j).set(n)); },
    start(name) {
      return w(ref.update({ performer: name, revealed: false, scores: null,
        round: firebase.database.ServerValue.increment(1) }));
    },
    reveal() {
      const s = state, key = ref.child('history').push().key;
      const u = { revealed: true };
      u['history/' + key] = { performer: s.performer, scores: s.scores, total: s.scores.reduce((a, b) => a + b, 0), at: Date.now() };
      return w(ref.update(u));
    },
    setBoard(on) { return w(ref.update({ showBoard: !!on })); },
    reset() { return w(ref.remove()); }
  };
})();
