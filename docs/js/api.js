// Talks to the FV Apps Script API (or the demo backend when no API_URL is set, or the address has ?demo).
(function () {
  const cfg = window.FV_CONFIG || {};
  const DEMO = !cfg.API_URL || /[?&]demo\b/.test(location.search);
  let token = null, user = null;
  try { token = localStorage.getItem('fv_token'); user = JSON.parse(localStorage.getItem('fv_user') || 'null'); } catch (e) {}

  function setSession(t, u) {
    token = t; user = u;
    try {
      if (t) { localStorage.setItem('fv_token', t); localStorage.setItem('fv_user', JSON.stringify(u)); }
      else { localStorage.removeItem('fv_token'); localStorage.removeItem('fv_user'); }
    } catch (e) {}
  }

  // Reads are retried when Google's servers hiccup; a save is sent once, so a slow reply can never apply it twice.
  const SAFE = ['login', 'logout', 'meta', 'load', 'admin'];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function post(payload) {
    const tries = SAFE.includes(payload.action) ? 3 : 1;
    let last = 'The server could not be reached. Please check the internet connection and try again.';
    for (let i = 0; i < tries; i++) {
      if (i) await sleep(1500 * i);
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 60000);
      try {
        const res = await fetch(cfg.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), signal: ctl.signal });
        const txt = await res.text();
        try { return JSON.parse(txt); } catch (e) { last = 'Google’s server is busy. Please try again in a minute.'; }
      } catch (e) {
        last = e.name === 'AbortError' ? 'Google’s server is taking too long. Please try again in a minute.' : last;
      } finally { clearTimeout(t); }
    }
    return { ok: false, error: last };
  }

  async function call(action, body = {}) {
    if (DEMO) return window.FV_DEMO.call(action, body, user || { name: 'Demo operator', isAdmin: true, username: 'demo' });
    if (!token) throw Object.assign(new Error('Please sign in.'), { auth: true });
    const out = await post(Object.assign({ action, token }, body));
    if (!out.ok) {
      const err = new Error(out.error || 'Something went wrong.');
      if (/sign in|sign-in|expired/i.test(out.error || '')) { err.auth = true; setSession(null, null); }
      throw err;
    }
    return out.data;
  }

  window.FV_API = {
    DEMO, call,
    get user() { return user; },
    async signIn(username, password) {
      const out = await post({ action: 'login', username, password });
      if (!out.ok) throw new Error(out.error || 'Could not sign in.');
      setSession(out.data.token, out.data.user);
      return out.data.user;
    },
    demoSignIn() { setSession('demo', { name: 'Demo operator', isAdmin: true, username: 'demo' }); },
    signOut() { if (!DEMO && token) post({ action: 'logout', token }).catch(() => {}); setSession(null, null); },
  };
})();
