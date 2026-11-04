// 1) Paste your Firebase web-app config here (Firebase console > Project settings > Your apps).
const FIREBASE_CONFIG = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://PASTE_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "PASTE_PROJECT_ID"
};

// 2) Nothing below needs editing.
const Store = (() => {
  const code = (new URLSearchParams(location.search).get('e') || '').replace(/[^A-Za-z0-9_-]/g, '');
  let ref = null, state = null, online = false;
  const listeners = [];
  const emit = () => listeners.forEach(f => f());
  const norm = v => {
    v = v || {};
    const sc = v.scores || {};
    return {
      couple: v.couple || '',
      round: v.round || 0,
      revealed: !!v.revealed,
      showBoard: v.showBoard !== false,
      scores: [sc.j1, sc.j2, sc.j3].map(x => x === undefined ? null : x),
      history: Object.values(v.history || {}).sort((a, b) => a.at - b.at)
    };
  };
  if (code) {
    firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.database();
    ref = db.ref('events/' + code);
    ref.on('value', snap => { state = norm(snap.val()); emit(); });
    db.ref('.info/connected').on('value', s => { online = !!s.val(); emit(); });
  }
  return {
    code,
    get state() { return state; },
    get online() { return online; },
    onChange(f) { listeners.push(f); },
    score(j, n) { return ref.child('scores/j' + j).set(n); },
    start(name) {
      return ref.update({ couple: name, revealed: false, scores: null,
        round: firebase.database.ServerValue.increment(1) });
    },
    reveal() {
      const s = state, key = ref.child('history').push().key;
      const u = { revealed: true };
      u['history/' + key] = { couple: s.couple, scores: s.scores, total: s.scores.reduce((a, b) => a + b, 0), at: Date.now() };
      return ref.update(u);
    },
    setBoard(on) { return ref.update({ showBoard: !!on }); },
    reset() { return ref.remove(); }
  };
})();
