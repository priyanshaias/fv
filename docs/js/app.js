// Forest Volunteers — screens: sign in, your details, circle, division, the volunteer sheet, and the admin dashboard.
(function () {
  const API = window.FV_API;
  const $ = s => document.querySelector(s);
  const app = $('#app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const enc = encodeURIComponent;
  const icon = {
    save: '<svg viewBox="0 0 24 24"><path d="M5 3h11l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M7 3v5h8V3M7 21v-7h10v7"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
    sheet: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>',
  };
  const HELP = { name: 'Sudipta Kundu', office: 'Aranya Bhawan', phone: '+91 70442 30806', tel: '+917044230806' };

  // the columns of the sheet, as in the "List of Volunteers" format sent to divisions
  const COLS = [
    { k: 'name', label: 'Name of Forest Volunteer Engaged', w: 230, req: true, cls: 'nm' },
    { k: 'dob', label: 'Date of Birth', w: 124, date: true },
    { k: 'qual', label: 'Educational Qualification', w: 190, list: 'qualList' },
    { k: 'deptRef', label: 'Forest Dept.’s approval ref', w: 200 },
    { k: 'dirRef', label: 'Forest Directorate’s Ref no sent to the Circle in Charge', w: 210 },
    { k: 'apptRef', label: 'Appointment Order issued by / reference', w: 210 },
    { k: 'doj', label: 'Date of Joining', w: 124, date: true },
    { k: 'place', label: 'Present place of Joining (Div HQ / Range / Beat / Camp)', w: 250, place: true },
    { k: 'works', label: 'Nature of Works assigned', w: 230, list: 'worksList' },
  ];
  const FIELDS = ['name', 'dob', 'qual', 'deptRef', 'dirRef', 'apptRef', 'doj', 'placeType', 'placeName', 'works'];
  const PLACES = ['Div HQ', 'Range', 'Beat', 'Camp', 'Other'];
  const QUALS = ['Below Class VIII', 'Class VIII', 'Madhyamik (Class X)', 'Higher Secondary (Class XII)', 'ITI / Diploma', 'Graduate', 'Post Graduate'];
  const WORKS = ['Patrolling', 'Elephant drive', 'Fire watch', 'Nursery and plantation', 'Office work, data entry', 'Anti-poaching camp', 'Eco-tourism', 'Check post duty'];

  /* ---------------- small helpers ---------------- */
  function toast(msg, err) { const t = $('#toast'); t.textContent = msg; t.className = 'toast on' + (err ? ' err' : ''); clearTimeout(t._t); t._t = setTimeout(() => t.className = 'toast', 4200); }
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };
  const op = () => store.get('fv_operator');
  const go = h => { location.hash = h; };
  const initials = s => String(s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  async function guard(fn) {
    try { return await fn(); }
    catch (e) { toast(e.message || 'Something went wrong.', true); if (e.auth) { go('#/'); route(); } throw e; }
  }
  const loading = text => `<div class="loader"><b class="ld-title">${esc(text)}</b><div class="ibar"><i></i></div>
    <p class="ld-step faint">The first load of the day can take up to 20 seconds.</p></div>`;
  const helpStrip = () => `<div class="help-strip"><span class="hq" aria-hidden="true">?</span>
    <span>Need help? Contact <b>${HELP.name}</b>, ${HELP.office} · <a href="tel:${HELP.tel}">${HELP.phone}</a></span>
    <button class="btn sm ghost" data-help>How to use</button></div>`;
  const shortWhen = s => { const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}:\d{2})/.exec(s || ''); return m ? `${m[1]}-${m[2]}-${m[3]}, ${m[4]}` : (s || ''); };

  /** "1/7/25", "01.07.2025", "2025-07-01" → "01-07-2025". Returns null when it cannot be read as a real date. */
  function normDate(s) {
    s = String(s || '').trim(); if (!s) return '';
    let d, m, y, x;
    if ((x = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s))) { y = +x[1]; m = +x[2]; d = +x[3]; }
    else if ((x = /^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{2}|\d{4})$/.exec(s))) { d = +x[1]; m = +x[2]; y = +x[3]; if (y < 100) y += y > 40 ? 1900 : 2000; }
    else return null;
    const t = new Date(y, m - 1, d);
    if (t.getFullYear() !== y || t.getMonth() !== m - 1 || t.getDate() !== d || y < 1940 || y > 2075) return null;
    return `${String(d).padStart(2, '0')}-${String(m).padStart(2, '0')}-${y}`;
  }
  function download(name, rows) {
    const csv = '﻿' + rows.map(r => r.map(v => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function dialog(title, sub, bodyHtml, buttons) {
    const el = document.createElement('div'); el.className = 'scrim';
    el.innerHTML = `<div class="dialog small-dlg" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="dhead"><div><h2>${esc(title)}</h2>${sub ? `<div class="sub">${sub}</div>` : ''}</div><button class="x" aria-label="Close">×</button></div>
      <div class="dbody">${bodyHtml}</div>
      ${buttons ? `<div class="dfoot"><span class="sp"></span>${buttons}</div>` : ''}</div>`;
    document.body.appendChild(el);
    const close = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 250); document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    el.addEventListener('click', e => { if (e.target === el || e.target.closest('.x')) close(); });
    requestAnimationFrame(() => el.classList.add('on'));
    return { el, close };
  }

  /* ---------------- help ---------------- */
  function openHelp() {
    dialog('How to use', 'Forest Volunteers · whom to call for help', `
      <div class="help-contact"><div><span class="faint">For any help, please contact</span><b>${HELP.name}</b><span>${HELP.office}</span></div>
        <a class="btn primary" href="tel:${HELP.tel}">Call ${HELP.phone}</a></div>
      <ol class="help-steps">
        <li><b>Choose your circle, then your division.</b></li>
        <li><b>Fill the sheet like Excel.</b> One row per volunteer. Click a cell and type; <span class="kbd">Enter</span> goes to the next row, <span class="kbd">Tab</span> to the next column.</li>
        <li><b>Already have the list in Excel?</b> Select the rows in Excel, copy, click the first Name cell here and paste (<span class="kbd">Ctrl</span> + <span class="kbd">V</span>).</li>
        <li><b>Save often</b> with the ${icon.save.replace('<svg', '<svg style="width:15px;height:15px;vertical-align:-2px;stroke:currentColor;fill:none;stroke-width:2"')} <b>Save</b> button or <span class="kbd">Ctrl</span> + <span class="kbd">S</span>. You can come back any time and continue.</li>
        <li><b>Yellow cells</b> are changed but not saved yet. <b>Red cells</b> need fixing (a missing name or a wrong date).</li>
        <li><b>Dates</b> are typed as DD-MM-YYYY, for example 01-07-2025.</li>
        <li>To remove a volunteer, press × at the end of the row, then Save. Press it again to undo.</li>
      </ol>
      <p class="faint">Every save is recorded with your name and designation. Your sign-in lasts 6 hours.</p>`);
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-help]')) { e.preventDefault(); openHelp(); } });

  /* ---------------- header ---------------- */
  function renderWho() {
    const u = API.user, o = op();
    $('#demoFlag').classList.toggle('hidden', !API.DEMO);
    if (!u) { $('#who').innerHTML = ''; return; }
    const nm = (o && o.name) || u.name;
    $('#who').innerHTML = `${u.isAdmin ? '<a class="btn sm ghost hide-sm" href="#/admin">Dashboard</a>' : ''}
      <button class="menu-btn" id="menuBtn" aria-haspopup="true" aria-expanded="false">
        <span class="av">${esc(initials(nm))}</span><span class="hide-sm">${esc(nm)}</span><span aria-hidden="true">▾</span></button>
      <div class="menu hidden" id="menu" role="menu">
        <div class="menu-who"><b>${esc(nm)}</b><span>${esc(o && o.designation || '')}${u.username ? ' · signed in as ' + esc(u.username) : ''}</span></div>
        ${u.isAdmin ? '<a role="menuitem" href="#/admin">Dashboard</a>' : ''}
        <a role="menuitem" href="#/circles">All circles</a>
        <button role="menuitem" id="meBtn">My details</button>
        <button role="menuitem" id="outBtn">Sign out</button>
      </div>`;
    const menu = $('#menu'), mb = $('#menuBtn');
    mb.onclick = e => { e.stopPropagation(); mb.setAttribute('aria-expanded', menu.classList.toggle('hidden') === false); };
    menu.querySelectorAll('a').forEach(a => a.onclick = () => menu.classList.add('hidden'));
    $('#outBtn').onclick = () => { if (G && dirty()) { toast('Save your changes before signing out.', true); return; } API.signOut(); META = null; go('#/'); route(); };
    $('#meBtn').onclick = () => { menu.classList.add('hidden'); renderOperator(true); };
  }
  document.addEventListener('click', e => { const m = $('#menu'); if (m && !e.target.closest('#menu')) m.classList.add('hidden'); });

  /* ---------------- sign in & your details ---------------- */
  function renderSignin() {
    app.innerHTML = `<section class="signin"><div class="card">
      <img class="emb" src="assets/emblem.svg" alt="National Emblem of India">
      <h1>Forest Volunteers</h1>
      <p class="muted">Directorate of Forests, West Bengal. Sign in to enter the Forest Volunteers engaged in your division.</p>
      ${API.DEMO ? `<button class="btn primary" id="demoBtn" style="width:100%">Try with demo data</button>
        <p class="faint" style="margin:12px 0 0">This copy is not connected to the live sheet. All names are made up and stay in this browser.</p>`
        : `<form class="form" id="pwForm" autocomplete="on">
            <label>Username<input name="username" id="username" autocomplete="username" autocapitalize="none" required></label>
            <label>Password<span class="pw"><input name="password" id="password" type="password" autocomplete="current-password" required>
              <button type="button" class="btn sm ghost" id="showPw" aria-label="Show password">Show</button></span></label>
            <button class="btn primary" type="submit" id="pwBtn">Sign in</button>
            <div id="pwMsg" class="faint" role="alert"></div>
            <p class="faint" style="margin:0">Use the same username and password as UPMC2.</p>
          </form>`}
      ${helpStrip()}
    </div></section>`;
    if (API.DEMO) { $('#demoBtn').onclick = () => { API.demoSignIn(); start(); }; return; }
    $('#showPw').onclick = () => { const i = $('#password'); i.type = i.type === 'password' ? 'text' : 'password'; $('#showPw').textContent = i.type === 'password' ? 'Show' : 'Hide'; };
    $('#pwForm').onsubmit = async e => {
      e.preventDefault();
      const btn = $('#pwBtn'); btn.disabled = true; btn.textContent = 'Signing in…'; $('#pwMsg').textContent = '';
      try { await API.signIn($('#username').value.trim(), $('#password').value); start(); }
      catch (err) { $('#pwMsg').textContent = err.message; $('#pwMsg').style.color = 'var(--danger-ink)'; btn.disabled = false; btn.textContent = 'Sign in'; }
    };
  }
  function renderOperator(editing) {
    const o = op() || {};
    app.innerHTML = `<section class="signin"><div class="card" style="text-align:left">
      <h1 style="font-size:26px">${editing ? 'Your details' : 'One more step'}</h1>
      <p class="muted" style="margin-bottom:0">Every change you save is recorded with these details.</p>
      <form class="form" id="opForm">
        <label>Your name<input name="name" id="opName" required value="${esc(o.name || '')}"></label>
        <label>Designation and office<input name="designation" id="opDesig" required placeholder="e.g. Head Clerk, Bankura (N) Division" value="${esc(o.designation || '')}"></label>
        <label>Mobile number (optional)<input name="mobile" id="opMobile" inputmode="numeric" maxlength="10" value="${esc(o.mobile || '')}"></label>
        <button class="btn primary" type="submit">Save and continue</button>
      </form></div></section>`;
    $('#opForm').onsubmit = e => {
      e.preventDefault();
      const d = { name: $('#opName').value.trim(), designation: $('#opDesig').value.trim(), mobile: $('#opMobile').value.trim() };
      if (d.mobile && !/^\d{10}$/.test(d.mobile)) { toast('Mobile number should have 10 digits.', true); return; }
      store.set('fv_operator', d); renderWho(); route();
    };
  }
  function start() { if (!op()) { renderWho(); renderOperator(false); return; } if (!location.hash || location.hash === '#/') go('#/circles'); else route(); }

  /* ---------------- circles & divisions ---------------- */
  let META = null;
  async function meta(force) {
    if (META && !force) return META;
    META = await guard(() => API.call('meta'));
    renderWho(); return META;
  }
  const divCount = (c, d) => (META.counts || {})[c + '|' + d] || 0;
  const divSaved = (c, d) => (META.saved || {})[c + '|' + d];
  function tile(title, sub, n, extra, href, i) {
    return `<a class="tile" href="${href}" style="animation-delay:${Math.min(i, 20) * 30}ms;text-decoration:none">
      <div class="cnt${n ? ' has' : ''}">${n}</div>
      <div class="t"><b>${esc(title)}</b><span>${esc(sub)}</span>${extra ? `<span class="when">${extra}</span>` : ''}</div></a>`;
  }
  async function renderCircles() {
    app.innerHTML = `<div class="head"><div><h1 class="page-title">Choose your circle.</h1><p class="page-sub">Then pick your division and fill the list of Forest Volunteers.</p></div></div>
      ${helpStrip()}${META ? '' : loading('Opening the volunteer register…')}<div class="tiles">${'<div class="skeleton"></div>'.repeat(8)}</div>`;
    const m = await meta();
    const ld = app.querySelector('.loader'); if (ld) ld.remove();
    app.querySelector('.tiles').innerHTML = m.circles.map((c, i) => {
      const n = c.divisions.reduce((a, d) => a + divCount(c.circle, d), 0), started = c.divisions.filter(d => divCount(c.circle, d)).length;
      return tile(c.circle, c.office, n, `${started} of ${c.divisions.length} divisions entered`, `#/c/${enc(c.circle)}`, i);
    }).join('');
  }
  async function renderDivisions(circle) {
    if (!META) app.innerHTML = loading('Opening the volunteer register…');
    const m = await meta(), c = m.circles.find(x => x.circle === circle);
    if (!c) { go('#/circles'); return; }
    app.innerHTML = `<div class="crumbs"><a href="#/circles">All circles</a><span class="sep">/</span><span>${esc(circle)}</span></div>
      <div class="head"><div><h1 class="page-title">${esc(circle)} circle.</h1><p class="page-sub">Choose your division.</p></div></div>
      <div class="tiles">${c.divisions.map((d, i) => {
        const s = divSaved(circle, d);
        return tile(d, 'Division', divCount(circle, d), s ? 'Saved ' + esc(shortWhen(s.on)) : '<span class="not-started">Not started</span>', `#/d/${enc(circle)}/${enc(d)}`, i);
      }).join('')}</div>`;
  }

  /* ---------------- the volunteer sheet ---------------- */
  // G: the division open on screen. rows: what is on screen; saved: what the server has, by id; base: version it was loaded at
  let G = null, keySeq = 0;
  const newKey = () => 'k' + Date.now().toString(36) + (keySeq++);
  const blankRow = () => FIELDS.reduce((o, k) => (o[k] = '', o), { key: newKey(), id: '' });
  const isBlank = r => FIELDS.every(k => !String(r[k] || '').trim());
  const draftKey = () => 'fv_draft|' + G.circle + '|' + G.division;
  const minBlank = 5;

  function cellChanged(r, k) {
    const s = r.id && G.saved[r.id];
    return s ? String(s[k] || '') !== String(r[k] || '').trim() : !!String(r[k] || '').trim();
  }
  function rowChanged(r) { return r.del ? !!r.id : (r.id ? FIELDS.some(k => cellChanged(r, k)) : !isBlank(r)); }
  function dirty() { return !!G && (G.rows.some(rowChanged) || G.orderChanged); }
  function changedCount() { return G.rows.filter(rowChanged).length; }
  function rowProblems(r) {
    if (r.del || isBlank(r)) return {};
    const p = {};
    if (!String(r.name || '').trim()) p.name = 'Name is needed';
    ['dob', 'doj'].forEach(k => { if (r[k] && normDate(r[k]) === null) p[k] = 'Not a date. Type DD-MM-YYYY'; });
    return p;
  }

  async function renderDivision(circle, division) {
    app.innerHTML = `<div class="crumbs"><a href="#/circles">All circles</a><span class="sep">/</span><a href="#/c/${enc(circle)}">${esc(circle)}</a><span class="sep">/</span><span>${esc(division)}</span></div>
      <div class="head"><div><h1 class="page-title">${esc(division)}</h1><p class="page-sub">${esc(circle)} circle · List of Forest Volunteers</p></div></div>
      ${loading('Fetching the volunteers of ' + division + '…')}`;
    await meta();
    const d = await guard(() => API.call('load', { circle, division }));
    if (location.hash !== `#/d/${enc(circle)}/${enc(division)}`) return;
    G = { circle, division, base: d.ver.n, ver: d.ver, saved: {}, rows: [], orderChanged: false, saving: false };
    d.rows.forEach(r => G.saved[r.id] = r);
    G.rows = d.rows.map(r => Object.assign({ key: newKey() }, r));
    // unsaved work from an earlier visit on this device
    const dr = store.get(draftKey());
    let restored = null;
    if (dr && dr.rows && dr.rows.some(r => !isBlank(r) || r.del)) {
      if (dr.base === G.base) { G.rows = dr.rows.map(r => Object.assign({}, r, { key: r.key || newKey() })); restored = 'same'; }
      else restored = 'stale';
    }
    padRows();
    drawSheet();
    if (restored === 'same' && dirty()) note(`Your unsaved changes from ${esc(dr.at)} on this device are back. Press <b>Save</b> to keep them, or <button class="btn sm ghost" id="discardDraft">${icon.undo} Discard them</button>`, 'attn');
    if (restored === 'stale') note(`You had unsaved changes from ${esc(dr.at)} on this device, but ${esc(G.ver.by || 'someone')} has saved this division since then, so the saved list is shown. <button class="btn sm ghost" id="dlDraft">${icon.down} Download my old changes</button> <button class="btn sm ghost" id="discardDraft">Forget them</button>`, 'attn');
    const dd = $('#discardDraft'); if (dd) dd.onclick = () => { store.del(draftKey()); renderDivision(circle, division); };
    const dl = $('#dlDraft'); if (dl) dl.onclick = () => download(`${division} - unsaved volunteers.csv`, csvRows(dr.rows.filter(r => !r.del && !isBlank(r))));
  }
  function note(html, kind) { const n = $('#sheetNote'); if (n) { n.innerHTML = html; n.className = 'notice ' + (kind || 'info'); n.classList.remove('hidden'); } }
  function padRows() {
    let trailing = 0;
    for (let i = G.rows.length - 1; i >= 0 && isBlank(G.rows[i]) && !G.rows[i].del; i--) trailing++;
    for (; trailing < minBlank; trailing++) G.rows.push(blankRow());
  }

  function cellHtml(r, i, c) {
    const v = k => esc(r[k] || ''), dis = r.del ? ' disabled' : '';
    const at = k => `data-r="${i}" data-k="${k}" id="c_${r.key}_${k}" aria-label="Row ${i + 1}, ${esc(c.label)}"${dis}`;
    if (c.place) {
      return `<div class="place"><select ${at('placeType')}><option value=""></option>${PLACES.map(p => `<option${r.placeType === p ? ' selected' : ''}>${p}</option>`).join('')}</select>
        <input ${at('placeName')} value="${v('placeName')}" placeholder="${r.placeType === 'Div HQ' ? '' : 'name'}" autocomplete="off"></div>`;
    }
    return `<input ${at(c.k)} value="${v(c.k)}"${c.date ? ' placeholder="DD-MM-YYYY" inputmode="numeric"' : ''}${c.list ? ` list="${c.list}"` : ''} autocomplete="off">`;
  }
  function rowHtml(r, i, sl) {
    const p = rowProblems(r), tdc = c => {
      const ks = c.place ? ['placeType', 'placeName'] : [c.k];
      const cl = [c.cls || '', ks.some(k => p[k]) ? 'bad' : '', ks.some(k => cellChanged(r, k)) && !r.del ? 'chg' : ''].join(' ').trim();
      const tip = ks.map(k => p[k]).filter(Boolean)[0];
      return `<td class="${cl}"${tip ? ` title="${esc(tip)}"` : ''}>${cellHtml(r, i, c)}</td>`;
    };
    return `<tr data-r="${i}" class="${r.del ? 'del' : ''}${!r.id && !isBlank(r) ? ' new' : ''}"><td class="sl">${sl}</td>${COLS.map(tdc).join('')}
      <td class="act">${isBlank(r) && !r.id ? '' : `<button class="xbtn" data-x="${i}" title="${r.del ? 'Undo remove' : 'Remove this volunteer'}" aria-label="${r.del ? 'Undo remove' : 'Remove'} row ${i + 1}">${r.del ? icon.undo : icon.x}</button>`}</td></tr>`;
  }
  function drawSheet(focusId) {
    const filled = G.rows.filter(r => !r.del && !isBlank(r)).length;
    let sl = 0;
    app.innerHTML = `<div class="crumbs"><a href="#/circles">All circles</a><span class="sep">/</span><a href="#/c/${enc(G.circle)}">${esc(G.circle)}</a><span class="sep">/</span><span>${esc(G.division)}</span></div>
      <div class="head"><div><h1 class="page-title">${esc(G.division)}</h1><p class="page-sub">${esc(G.circle)} circle · ${filled} volunteer${filled === 1 ? '' : 's'}${G.ver.on ? ` · last saved ${esc(shortWhen(G.ver.on))} by ${esc(G.ver.by)}` : ' · not saved yet'}</p></div></div>
      <div id="sheetNote" class="notice hidden" style="margin:0 0 14px"></div>
      <div class="sheetbar">
        <button class="btn primary save" id="saveBtn" title="Save (Ctrl + S)">${icon.save} Save</button>
        <span class="state" id="state"></span>
        <span class="sp"></span>
        <button class="btn sm ghost" id="addRows">${icon.plus} Add 10 rows</button>
        <button class="btn sm ghost" id="dlBtn">${icon.down} <span class="hide-sm">Download</span> Excel</button>
        <button class="btn sm ghost" data-help>? <span class="hide-sm">How to fill</span></button>
      </div>
      <div class="grid-wrap" id="gridWrap"><div class="grid-title">List of Volunteers · ${esc(G.division)}</div>
        <table class="grid" id="grid" style="width:${54 + 44 + COLS.reduce((a, c) => a + c.w, 0)}px"><colgroup><col style="width:54px">${COLS.map(c => `<col style="width:${c.w}px">`).join('')}<col style="width:44px"></colgroup>
          <thead><tr><th class="sl">Sl No</th>${COLS.map(c => `<th class="${c.cls || ''}">${esc(c.label)}${c.req ? ' <span class="req">*</span>' : ''}</th>`).join('')}<th class="act"></th></tr></thead>
          <tbody>${G.rows.map((r, i) => rowHtml(r, i, r.del || isBlank(r) ? (r.del ? '—' : '') : ++sl)).join('')}</tbody></table></div>
      <div class="gridfoot"><span><i class="legend-sq" style="background:var(--chg)"></i>changed, not saved</span><span><i class="legend-sq" style="background:var(--bad);border-color:var(--danger)"></i>needs fixing</span>
        <span>· Paste straight from Excel: copy the rows there, click a Name cell here, press <span class="kbd">Ctrl</span> + <span class="kbd">V</span>.</span></div>
      <datalist id="qualList">${QUALS.map(q => `<option value="${esc(q)}">`).join('')}</datalist>
      <datalist id="worksList">${WORKS.map(q => `<option value="${esc(q)}">`).join('')}</datalist>`;
    const grid = $('#grid');
    grid.addEventListener('input', onInput);
    grid.addEventListener('change', onChange);
    grid.addEventListener('focusout', onBlur);
    grid.addEventListener('keydown', onKey);
    grid.addEventListener('paste', onPaste);
    grid.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b) toggleDel(+b.dataset.x); });
    $('#saveBtn').onclick = save;
    $('#addRows').onclick = () => { for (let i = 0; i < 10; i++) G.rows.push(blankRow()); const k = G.rows[G.rows.length - 10].key; redraw('c_' + k + '_name'); };
    $('#dlBtn').onclick = () => download(`${G.division} - Forest Volunteers.csv`, csvRows(G.rows.filter(r => !r.del && !isBlank(r))));
    setState();
    if (focusId) { const f = document.getElementById(focusId); if (f) f.focus(); }
  }
  /** Re-draws the sheet, keeping the scroll position of the grid and the page. */
  function redraw(focusId) {
    const w = $('#gridWrap'), st = w ? w.scrollTop : 0, sl = w ? w.scrollLeft : 0, y = window.scrollY, nt = $('#sheetNote');
    const noteHtml = nt && !nt.classList.contains('hidden') ? [nt.innerHTML, nt.className] : null;
    drawSheet();
    const w2 = $('#gridWrap'); w2.scrollTop = st; w2.scrollLeft = sl; window.scrollTo(0, y);
    if (noteHtml) { const n = $('#sheetNote'); n.innerHTML = noteHtml[0]; n.className = noteHtml[1]; const dd = $('#discardDraft'); if (dd) dd.onclick = () => { store.del(draftKey()); renderDivision(G.circle, G.division); }; }
    if (focusId) { const f = document.getElementById(focusId); if (f) f.focus({ preventScroll: false }); }
  }
  function csvRows(rows) {
    return [['Sl No', 'Name of Forest Volunteer Engaged', 'Date of Birth', 'Educational Qualification', 'Circle', 'Division', 'Forest Dept.\'s approval ref',
      'Forest Directorate\'s Ref no sent to the Circle in Charge', 'Appointment Order issued by/ reference', 'Date of Joining',
      'Present place of Joining (Div HQ/ Range/ Beat/ Camp)', 'Nature of Works assigned']]
      .concat(rows.map((r, i) => [i + 1, r.name, r.dob, r.qual, G.circle, G.division, r.deptRef, r.dirRef, r.apptRef, r.doj,
        [r.placeType, r.placeName].filter(Boolean).join(': '), r.works]));
  }

  /* -- editing -- */
  let draftT = null;
  function saveDraft() {
    clearTimeout(draftT);
    draftT = setTimeout(() => {
      if (!G) return;
      if (dirty()) store.set(draftKey(), { base: G.base, at: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), rows: G.rows.filter(r => !isBlank(r) || r.del) });
      else store.del(draftKey());
    }, 300);
  }
  function setState(kind, text) {
    const s = $('#state'), b = $('#saveBtn'); if (!s) return;
    const n = changedCount();
    if (!kind) kind = G.saving ? 'saving' : dirty() ? 'dirty' : 'clean';
    s.className = 'state ' + kind;
    s.textContent = text || (kind === 'saving' ? 'Saving…' : kind === 'dirty' ? `Unsaved changes in ${n || 'the'} row${n === 1 ? '' : 's'}` : G.ver.on ? 'All changes saved' : 'Nothing entered yet');
    b.classList.toggle('dirty', kind === 'dirty');
    b.disabled = G.saving;
  }
  function refreshCell(input) {
    const i = +input.dataset.r, r = G.rows[i], td = input.closest('td'), p = rowProblems(r);
    const ks = Array.from(td.querySelectorAll('[data-k]')).map(x => x.dataset.k);
    td.classList.toggle('chg', ks.some(k => cellChanged(r, k)));
    // a name problem can appear or go away when any cell of the row changes
    const tr = td.closest('tr');
    tr.querySelectorAll('td').forEach(c => {
      const kk = Array.from(c.querySelectorAll('[data-k]')).map(x => x.dataset.k);
      if (!kk.length) return;
      if (c.classList.contains('bad') && !kk.some(k => p[k])) { c.classList.remove('bad'); c.removeAttribute('title'); }
    });
    if (p.name) { const n = tr.querySelector('[data-k="name"]').closest('td'); if (!r.name.trim() && document.activeElement !== tr.querySelector('[data-k="name"]')) n.classList.add('bad'); }
  }
  function onInput(e) {
    const t = e.target; if (!t.dataset || !t.dataset.k) return;
    const i = +t.dataset.r, r = G.rows[i], wasBlank = isBlank(r);
    r[t.dataset.k] = t.value;
    refreshCell(t);
    if (wasBlank !== isBlank(r)) {           // a new row started (or emptied): renumber and keep enough blank rows below
      padRows();
      const id = t.id, pos = t.selectionStart; redraw(id);
      const f = document.getElementById(id); if (f && f.setSelectionRange && pos != null) try { f.setSelectionRange(pos, pos); } catch (er) {}
    }
    setState(); saveDraft();
  }
  function onChange(e) { if (e.target.tagName === 'SELECT') onInput(e); }
  function onBlur(e) {
    const t = e.target; if (!t.dataset || !t.dataset.k) return;
    const r = G.rows[+t.dataset.r]; if (!r) return;
    if (t.dataset.k === 'dob' || t.dataset.k === 'doj') {
      const n = normDate(t.value);
      if (n !== null && n !== t.value) { t.value = n; r[t.dataset.k] = n; }
      const td = t.closest('td'); td.classList.toggle('bad', n === null); if (n === null) td.title = 'Not a date. Type DD-MM-YYYY'; else td.removeAttribute('title');
      refreshCell(t); setState(); saveDraft();
    }
    if (t.dataset.k !== 'name') { const p = rowProblems(r), nm = t.closest('tr').querySelector('[data-k="name"]'); if (p.name && nm) nm.closest('td').classList.add('bad'); }
  }
  function cellAt(i, k) { const r = G.rows[i]; return r ? document.getElementById(`c_${r.key}_${k}`) : null; }
  function onKey(e) {
    const t = e.target; if (!t.dataset || !t.dataset.k) return;
    const i = +t.dataset.r, k = t.dataset.k;
    let to = null;
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); to = i + 1; }
    else if (e.key === 'ArrowDown' && t.tagName !== 'SELECT' && !t.list) to = i + 1;
    else if (e.key === 'ArrowUp' && t.tagName !== 'SELECT' && !t.list) to = i - 1;
    if (to == null) return;
    e.preventDefault();
    if (to >= G.rows.length) { for (let n = 0; n < 5; n++) G.rows.push(blankRow()); redraw(); }
    const f = cellAt(Math.max(0, to), k); if (f) { f.focus(); if (f.select) f.select(); }
  }
  function toggleDel(i) {
    const r = G.rows[i]; if (!r) return;
    if (!r.id && !r.del) { G.rows.splice(i, 1); padRows(); }       // a row never saved just goes
    else r.del = !r.del;
    redraw(); setState(); saveDraft();
    if (r.del) toast(`${r.name || 'This volunteer'} will be removed when you press Save.`);
  }
  // pasting rows copied from Excel. A 12-column row in the circular's format (Sl No … Circle, Division …) is mapped by position.
  const PASTE_KEYS = ['name', 'dob', 'qual', 'deptRef', 'dirRef', 'apptRef', 'doj', 'place', 'works'];
  function onPaste(e) {
    const t = e.target; if (!t.dataset || !t.dataset.k) return;
    const txt = (e.clipboardData || window.clipboardData).getData('text');
    if (!/[\t\n]/.test(txt.replace(/\n$/, ''))) return;                     // one value: let the browser paste it
    e.preventDefault();
    const lines = txt.replace(/\r/g, '').replace(/\n+$/, '').split('\n').map(l => l.split('\t'));
    const startK = t.dataset.k === 'placeType' || t.dataset.k === 'placeName' ? 'place' : t.dataset.k;
    let i = +t.dataset.r, n = 0;
    lines.forEach(cells => {
      let vals;
      if (cells.length >= 12) vals = [1, 2, 3, 6, 7, 8, 9, 10, 11].map(c => cells[c]);           // Sl, Name, DOB, Qual, Circle, Division, …
      else if (cells.length === 11) vals = [0, 1, 2, 5, 6, 7, 8, 9, 10].map(c => cells[c]);      // the same without Sl No
      else vals = PASTE_KEYS.slice(PASTE_KEYS.indexOf(startK)).map((k, j) => cells[j]);
      const keys = cells.length >= 11 ? PASTE_KEYS : PASTE_KEYS.slice(PASTE_KEYS.indexOf(startK));
      if (vals.every(v => !String(v || '').trim())) return;
      while (i >= G.rows.length) G.rows.push(blankRow());
      const r = G.rows[i];
      keys.forEach((k, j) => {
        let v = String(vals[j] == null ? '' : vals[j]).trim(); if (j >= vals.length) return;
        if (k === 'place') {
          const m = /^(div(?:ision)?\.?\s*hq|hq|range|beat|camp)\b[\s:,\-–/]*(.*)$/i.exec(v);
          if (m) { r.placeType = /hq/i.test(m[1]) ? 'Div HQ' : m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(); r.placeName = m[2]; }
          else r.placeName = v;
        } else if (k === 'dob' || k === 'doj') { const d = normDate(v); r[k] = d === null ? v : d; }
        else r[k] = v;
      });
      i++; n++;
    });
    padRows(); redraw(t.id); setState(); saveDraft();
    toast(`Pasted ${n} row${n === 1 ? '' : 's'}. Check them, then press Save.`);
  }

  /* -- saving -- */
  async function save(force) {
    if (!G || G.saving) return;
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
    const bad = G.rows.map((r, i) => [i, rowProblems(r)]).filter(x => Object.keys(x[1]).length);
    if (bad.length) {
      redraw();
      const [i, p] = bad[0], f = cellAt(i, Object.keys(p)[0]); if (f) f.focus();
      toast(`Fix the red cell${bad.length > 1 ? 's' : ''} first: ${Object.values(p)[0]}.`, true); return;
    }
    if (!dirty() && force !== true) { setState('clean', 'Nothing to save. All changes are saved.'); return; }
    const sent = G.rows.filter(r => !r.del && !isBlank(r));
    G.saving = true; setState('saving');
    let res;
    try {
      res = await API.call('save', { circle: G.circle, division: G.division, base: G.base, force: force === true,
        rows: sent.map(r => FIELDS.reduce((o, k) => (o[k] = String(r[k] || '').trim(), o), { id: r.id, key: r.key })), operator: op() });
    } catch (e) {
      G.saving = false; setState('err', 'Not saved. ' + (e.message || '')); toast('Not saved: ' + (e.message || 'please try again.'), true);
      if (e.auth) { toast('Your sign-in has expired. Your changes are kept on this device. Sign in again and press Save.', true); setTimeout(() => { go('#/'); route(); }, 1800); }
      return;
    }
    G.saving = false;
    if (res.conflict) { setState('err', 'Not saved yet'); conflict(res); return; }
    G.saved = {}; res.rows.forEach(r => G.saved[r.id] = r);
    G.rows = res.rows.map(r => Object.assign({ key: newKey() }, r));
    G.base = res.ver.n; G.ver = res.ver; G.orderChanged = false;
    store.del(draftKey());
    if (META) { META.counts[G.circle + '|' + G.division] = res.rows.length; if (res.changes) META.saved[G.circle + '|' + G.division] = { on: res.ver.on, by: res.ver.by }; }
    padRows(); redraw();
    setState('clean', res.changes ? `Saved · ${res.rows.length} volunteer${res.rows.length === 1 ? '' : 's'}` : 'All changes saved');
    toast(res.changes ? `Saved. ${res.changes} change${res.changes === 1 ? '' : 's'} recorded.` : 'Nothing had changed.');
  }
  function conflict(res) {
    const d = dialog('Someone else saved this division', esc(res.message), `
      <p>Your changes are <b>not lost</b>. They are kept on this device.</p>
      <p>Choose one:</p>
      <ul class="help-steps"><li><b>See their list</b> opens what was saved. Download your changes first if you want to compare.</li>
      <li><b>Save mine anyway</b> replaces their list with yours. Their changes stay in the change log.</li></ul>`,
      `<button class="btn" id="cfDl">${icon.down} Download mine</button><button class="btn" id="cfTheirs">See their list</button><button class="btn primary" id="cfMine">Save mine anyway</button>`);
    d.el.querySelector('#cfDl').onclick = () => download(`${G.division} - my unsaved volunteers.csv`, csvRows(G.rows.filter(r => !r.del && !isBlank(r))));
    d.el.querySelector('#cfTheirs').onclick = () => { d.close(); store.del(draftKey()); renderDivision(G.circle, G.division); };
    d.el.querySelector('#cfMine').onclick = () => { d.close(); save(true); };
  }
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) { if (G && $('#grid')) { e.preventDefault(); save(); } }
  });
  window.addEventListener('beforeunload', e => { if (G && $('#grid') && dirty()) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------------- admin dashboard ---------------- */
  const A = { q: '', act: 'all', circle: 'all', data: null };
  async function renderAdmin() {
    if (!API.user || !API.user.isAdmin) { go('#/circles'); return; }
    app.innerHTML = `<div class="head"><div><h1 class="page-title">Dashboard.</h1><p class="page-sub">Volunteers entered by each division, and every change made.</p></div></div>${loading('Collecting all divisions…')}`;
    const [m, d] = await Promise.all([meta(true), guard(() => API.call('admin'))]);
    A.data = d; drawAdmin(m, d);
  }
  function drawAdmin(m, d) {
    const allDivs = [].concat(...m.circles.map(c => c.divisions.map(dv => ({ circle: c.circle, division: dv }))));
    const started = allDivs.filter(x => divCount(x.circle, x.division)).length;
    const today = (() => { const t = new Date(); return `${String(t.getDate()).padStart(2, '0')}-${String(t.getMonth() + 1).padStart(2, '0')}-${t.getFullYear()}`; })();
    const savesToday = new Set(d.log.filter(l => l.on.startsWith(today)).map(l => l.on + l.division)).size;
    app.innerHTML = `<div class="head"><div><h1 class="page-title">Dashboard.</h1><p class="page-sub">Volunteers entered by each division, and every change made. Saves go in directly; nothing waits for approval.</p></div>
        <span class="sp"></span>${d.sheetUrl ? `<a class="btn soft" href="${esc(d.sheetUrl)}" target="_blank" rel="noopener">${icon.sheet} Open Google Sheet</a>` : ''}</div>
      <div class="kpis">
        <div class="kpi"><span>Volunteers entered</span><b>${d.rows.length}</b></div>
        <div class="kpi"><span>Divisions entered</span><b>${started} <small style="font-size:15px;color:var(--text-subtle);font-weight:600">of ${allDivs.length}</small></b></div>
        <div class="kpi"><span>Changes recorded</span><b>${d.logTotal}</b></div>
        <div class="kpi"><span>Saves today</span><b>${savesToday}</b></div>
      </div>
      <div class="adm-grid">
        <div class="tablecard"><div class="tc-head"><h2>Divisions</h2><span class="sp"></span>
            <select id="admCircle" class="btn sm" aria-label="Circle"><option value="all">All circles</option>${m.circles.map(c => `<option${A.circle === c.circle ? ' selected' : ''}>${esc(c.circle)}</option>`).join('')}</select>
            <button class="btn sm" id="dlAll">${icon.down} All volunteers (Excel)</button></div>
          <div class="tscroll"><table class="dtable"><thead><tr><th>Division</th><th class="r">Volunteers</th><th>Last saved</th><th>By</th></tr></thead><tbody id="divBody"></tbody></table></div></div>
        <div class="tablecard"><div class="tc-head"><h2>Change log</h2>
            <div class="seg" id="actSeg">${['all', 'Added', 'Edited', 'Removed'].map(a => `<button data-a="${a}" class="${A.act === a ? 'on' : ''}">${a === 'all' ? 'All' : a}</button>`).join('')}</div>
            <span class="sp"></span><label class="adm-search"><input id="logQ" placeholder="Search name, division, person…" value="${esc(A.q)}" aria-label="Search the change log"></label>
            <button class="btn sm" id="dlLog">${icon.down} Change log (Excel)</button></div>
          <div class="tscroll"><table class="dtable"><thead><tr><th>When</th><th>Saved by</th><th>Division</th><th>Volunteer</th><th>What</th><th>Old → new</th></tr></thead><tbody id="logBody"></tbody></table></div>
          <div class="faint" id="logMore" style="padding:10px 16px"></div></div>
      </div>`;
    const drawDivs = () => {
      $('#divBody').innerHTML = m.circles.filter(c => A.circle === 'all' || c.circle === A.circle).map(c =>
        `<tr class="plainrow"><td colspan="4" class="circle-h">${esc(c.circle)} <span class="faint">· ${c.divisions.reduce((a, dv) => a + divCount(c.circle, dv), 0)} volunteers</span></td></tr>` +
        c.divisions.map(dv => { const s = divSaved(c.circle, dv), n = divCount(c.circle, dv);
          return `<tr data-go="#/d/${enc(c.circle)}/${enc(dv)}"><td class="tn">${esc(dv)}</td><td class="r num">${n}</td><td>${s ? esc(shortWhen(s.on)) : '<span class="not-started">Not started</span>'}</td><td>${s ? esc(s.by) : ''}</td></tr>`; }).join('')).join('');
    };
    const drawLog = () => {
      const q = A.q.toLowerCase().trim();
      const list = d.log.filter(l => (A.act === 'all' || l.action === A.act) && (A.circle === 'all' || l.circle === A.circle) &&
        (!q || [l.by, l.desig, l.username, l.division, l.circle, l.vname, l.field, l.old, l.value].join(' ').toLowerCase().includes(q)));
      $('#logBody').innerHTML = list.slice(0, 400).map(l => `<tr class="plainrow"><td class="num" style="white-space:nowrap">${esc(shortWhen(l.on))}</td>
        <td><b>${esc(l.by)}</b><div class="faint">${esc(l.desig)}${l.mobile ? ' · ' + esc(l.mobile) : ''}${l.username ? ' · ' + esc(l.username) : ''}</div></td>
        <td>${esc(l.division)}<div class="faint">${esc(l.circle)}</div></td><td>${esc(l.vname)}</td>
        <td><span class="act-tag ${esc(l.action)}">${esc(l.action)}</span>${l.field ? `<div class="faint">${esc(l.field)}</div>` : ''}</td>
        <td>${l.old ? `<span class="chg-old">${esc(l.old)}</span>` : ''}${l.old && l.value ? ' → ' : ''}${l.value ? `<span class="chg-new">${esc(l.value)}</span>` : ''}</td></tr>`).join('')
        || '<tr class="plainrow"><td colspan="6" class="muted" style="padding:24px;text-align:center">No changes match.</td></tr>';
      $('#logMore').textContent = list.length > 400 ? `Showing the latest 400 of ${list.length}. Download the change log for all of them.` : `${list.length} change${list.length === 1 ? '' : 's'}`;
    };
    drawDivs(); drawLog();
    $('#divBody').onclick = e => { const tr = e.target.closest('[data-go]'); if (tr) go(tr.dataset.go); };
    $('#admCircle').onchange = e => { A.circle = e.target.value; drawDivs(); drawLog(); };
    $('#actSeg').onclick = e => { const b = e.target.closest('[data-a]'); if (!b) return; A.act = b.dataset.a; $('#actSeg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); drawLog(); };
    $('#logQ').oninput = e => { A.q = e.target.value; drawLog(); };
    $('#dlAll').onclick = () => {
      const rows = d.rows.filter(r => A.circle === 'all' || r.circle === A.circle).sort((a, b) => (a.circle + a.division).localeCompare(b.circle + b.division) || (+a.sl - +b.sl));
      download(`Forest Volunteers${A.circle === 'all' ? '' : ' - ' + A.circle}.csv`, [['Sl No', 'Circle', 'Division', 'Name of Forest Volunteer Engaged', 'Date of Birth', 'Educational Qualification',
        'Forest Dept.\'s approval ref', 'Forest Directorate\'s Ref no sent to the Circle in Charge', 'Appointment Order issued by/ reference', 'Date of Joining',
        'Present place of Joining', 'Name of the place', 'Nature of Works assigned', 'Last Updated On', 'Last Updated By', 'Volunteer ID']]
        .concat(rows.map((r, i) => [i + 1, r.circle, r.division, r.name, r.dob, r.qual, r.deptRef, r.dirRef, r.apptRef, r.doj, r.placeType, r.placeName, r.works, r.updOn, r.updBy, r.id])));
    };
    $('#dlLog').onclick = () => download('Forest Volunteers - change log.csv', [['When', 'Saved by', 'Designation', 'Mobile', 'Username', 'Circle', 'Division', 'Volunteer ID', 'Volunteer', 'Action', 'Field', 'Old value', 'New value']]
      .concat(d.log.map(l => [l.on, l.by, l.desig, l.mobile, l.username, l.circle, l.division, l.vid, l.vname, l.action, l.field, l.old, l.value])));
  }

  /* ---------------- router ---------------- */
  async function route() {
    if (!API.user) { renderWho(); renderSignin(); return; }
    if (!op()) { renderWho(); renderOperator(false); return; }
    renderWho();
    const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
    if (parts[0] !== 'd') G = null;
    try {
      if (parts[0] === 'c' && parts[1]) await renderDivisions(parts[1]);
      else if (parts[0] === 'd' && parts[2]) await renderDivision(parts[1], parts[2]);
      else if (parts[0] === 'admin') await renderAdmin();
      else await renderCircles();
    } catch (e) { /* toast already shown */ }
    window.scrollTo(0, 0);
  }
  let lastHash = location.hash;
  window.addEventListener('hashchange', () => {
    if (G && $('#grid') && dirty() && !location.hash.startsWith(`#/d/${enc(G.circle)}/${enc(G.division)}`)) {
      // leaving a sheet with unsaved changes: they stay on this device as a draft, so just say so
      store.set(draftKey(), { base: G.base, at: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }), rows: G.rows.filter(r => !isBlank(r) || r.del) });
      toast(`Unsaved changes in ${G.division} are kept on this device. Open it again to save them.`);
    }
    lastHash = location.hash; route();
  });
  if (API.user) start(); else route();
})();
