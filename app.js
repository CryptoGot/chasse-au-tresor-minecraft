/* Logique de la chasse au trésor */
(function () {
  'use strict';
  const H = window.HUNT, G = window.GFX;
  const $ = (s) => document.querySelector(s);
  const QN = H.quetes.length;

  G.init();
  const I = G.ICON;

  /* ---------- habillage ---------- */
  const root = document.documentElement.style;
  root.setProperty('--dirt', G.url('dirt', 0.55, 64));
  root.setProperty('--stone', G.url('stoneLogo', 0, 32));
  root.setProperty('--gold', G.url('gold', 0, 32));
  root.setProperty('--btn', G.url('btn', 0, 64));
  root.setProperty('--paper', G.url('paper', 0, 64));
  root.setProperty('--parch', G.url('parchment', 0, 64));
  $('#fav').href = I.grass;
  $('#ed-name').textContent = H.joueur.toUpperCase();
  $('#intro-from').textContent = 'Message du ' + H.maitre;
  $('#win-chest').src = I.chest;
  const SPLASH = ['Avec les copains !', '100% village !', 'Attention aux creepers !', 'Pas de triche !', 'Énigmes incluses !',
    'Garanti sans lag !', 'Spécial ' + H.joueur + ' !', 'Ne creusez pas tout droit !', 'Niveau 12 débloqué !', 'Trésor véritable !'];
  $('#splash').textContent = SPLASH[Math.floor(Math.random() * SPLASH.length)];

  /* ---------- sauvegarde ---------- */
  const SAVE = 'mc-chasse-v1';
  const fresh = () => ({ step: 0, hearts: 10, wrong: 0, hints: H.quetes.map(() => 0), deaths: 0, start: null, end: null, found: false, lockUntil: 0 });
  let S = (function () {
    try { const s = JSON.parse(localStorage.getItem(SAVE)); if (s && typeof s.step === 'number') return Object.assign(fresh(), s); } catch (e) { /* stockage indisponible */ }
    return fresh();
  })();
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } }

  /* ---------- sons (synthétisés) ---------- */
  const Snd = {
    ctx: null, on: true,
    init() {
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
      } catch (e) { /* pas d'audio */ }
    },
    tone(f, d, type, vol, when, slide, lp) {
      if (!this.on || !this.ctx) return;
      const c = this.ctx, t = c.currentTime + (when || 0);
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.08, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      let node = o;
      if (lp) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl); node = fl; }
      node.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + d + 0.05);
    },
    click() { this.tone(1100, 0.045, 'square', 0.035); },
    orb() { this.tone(1500 + Math.random() * 700, 0.14, 'sine', 0.1); },
    levelup() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.11, i * 0.08)); },
    hmm() { this.tone(260, 0.38, 'sawtooth', 0.09, 0, 170, 900); this.tone(200, 0.3, 'sawtooth', 0.05, 0.12, 150, 700); },
    hurt() { this.tone(320, 0.18, 'square', 0.07, 0, 110, 1200); },
    tick() { this.tone(700 + Math.random() * 500, 0.03, 'square', 0.02); },
    boom() { this.tone(110, 0.4, 'sawtooth', 0.05, 0, 40, 350); },
    fanfare() {
      const n = [392, 523, 659, 784, 659, 784, 1047];
      n.forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.12, i * 0.13));
      this.tone(1047, 1, 'triangle', 0.1, n.length * 0.13);
    }
  };
  try { Snd.on = localStorage.getItem('mc-son') !== '0'; } catch (e) { /* défaut : son activé */ }
  function renderSound() { $('#btn-sound').classList.toggle('off', !Snd.on); }

  /* ---------- outils ---------- */
  const pano = G.Panorama($('#pano'));
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    window.scrollTo(0, 0);
    const withPano = id === 's-title' || id === 's-win';
    $('#pano').style.display = withPano ? 'block' : 'none';
    if (withPano) pano.start(); else pano.stop();
    if (id !== 's-win') FW.stop();
  }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
      .replace(/^(?:(?:un|une|le|la|les|des|du)\s+|l['’]\s*)/, '')
      .replace(/[^a-z0-9]/g, '');
  }
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[a.length][b.length];
  }
  function matchOne(v, list) {
    if (!list || !list.length) return true;
    const n = norm(v), nums = String(v).match(/\d+/g);
    return list.some((a) => {
      const m = norm(a);
      if (!m) return false;
      // nombre attendu : « 2 », « 02 » ou « 2 bancs » passent, pas « 1 2 3 »
      if (/^\d+$/.test(m)) return !!nums && nums.length === 1 && parseInt(nums[0], 10) === parseInt(m, 10);
      return n === m || (m.length >= 5 && lev(n, m) <= 1);
    });
  }
  function perms(n) {
    if (n <= 1) return [[0]];
    const out = [];
    perms(n - 1).forEach((p) => { for (let k = 0; k <= p.length; k++) out.push(p.slice(0, k).concat([n - 1], p.slice(k))); });
    return out;
  }
  const champsOf = (q) => q.champs || [{ label: null, reponses: q.reponses, clavier: q.clavier }];
  function checkAll(vals, q) {
    const ch = champsOf(q);
    if (q.ordreLibre) return perms(ch.length).some((p) => p.every((ci, k) => matchOne(vals[k], ch[ci].reponses)));
    return ch.every((c, k) => matchOne(vals[k], c.reponses));
  }
  const ATTENTE = H.ATTENTE_MS || 30000;
  let lockTimer;
  function updateLock() {
    clearTimeout(lockTimer);
    const left = Math.ceil(((S.lockUntil || 0) - Date.now()) / 1000), b = $('#btn-submit');
    if (left > 0) { b.disabled = true; b.textContent = 'Attendez ' + left + ' s…'; lockTimer = setTimeout(updateLock, 250); }
    else { b.disabled = false; b.textContent = 'Valider'; }
  }
  function fmt(ms) {
    const m = Math.max(1, Math.round(ms / 60000));
    return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0');
  }

  /* ---------- modale & toast ---------- */
  function modal(o) {
    const m = $('#modal');
    m.innerHTML = '<div class="modal-box panel"><h3>' + o.title + '</h3><div class="modal-body">' + (o.html || '') + '</div><div class="modal-btns"></div></div>';
    const box = m.querySelector('.modal-btns');
    (o.buttons || [{ label: 'OK' }]).forEach((b) => {
      const el = document.createElement('button');
      el.className = 'mc-btn' + (b.primary ? ' primary' : '');
      el.textContent = b.label;
      el.addEventListener('click', () => { Snd.click(); m.classList.remove('open'); m.innerHTML = ''; if (b.action) b.action(); });
      box.appendChild(el);
    });
    m.classList.add('open');
  }
  let toastTimer;
  function toast(kind, title, icon, cls) {
    const t = $('#toast');
    t.className = cls || '';
    t.innerHTML = '<div class="slot"><img src="' + I[icon] + '" alt=""></div><div><div class="toast-kind">' + kind + '</div><div class="toast-title">' + title + '</div></div>';
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 4500);
  }

  /* ---------- écran titre & intro ---------- */
  function renderTitle() {
    $('#btn-play').textContent = S.found ? 'Revoir la victoire' : S.start ? "Continuer l'aventure" : 'Jouer';
    $('#btn-reset').hidden = !S.start;
    $('#title-note').textContent = S.start && !S.found ? (S.step < QN ? 'Quête ' + (S.step + 1) + '/' + QN + ' en cours' : 'Carte au trésor débloquée') : '';
    show('s-title');
  }
  $('#intro-text').innerHTML =
    '<p>Salut <b>' + H.equipe + '</b> !</p>' +
    '<p>Le ' + H.maitre + ' a caché un <b>trésor</b>. Pour le trouver, vous allez devoir explorer le village comme de vrais aventuriers Minecraft.</p>' +
    '<ul>' +
    '<li><img src="' + I.map + '" alt="">Chaque quête est une énigme qui vous mène à un endroit du village.</li>' +
    '<li><img src="' + I.grass + '" alt="">Une fois sur place, répondez à la question : la réponse se trouve sur place, impossible de tricher !</li>' +
    '<li><img src="' + I.torch + '" alt="">Bloqués ? Utilisez un indice.</li>' +
    '<li><img src="' + I.heart + '" alt="">Chaque mauvaise réponse vous coûte un cœur… et ' + Math.round(ATTENTE / 1000) + ' secondes d\'attente !</li>' +
    '</ul>' +
    '<div class="warn"><img src="' + I.creeper + '" alt="">Restez ensemble et attention aux voitures : c\'est plus dangereux qu\'un creeper !</div>';

  $('#btn-play').addEventListener('click', () => {
    Snd.init(); Snd.click();
    if (S.found) renderWin();
    else if (S.step >= QN) renderMap();
    else if (S.start) renderQuest();
    else show('s-intro');
  });
  $('#btn-reset').addEventListener('click', () => {
    Snd.init(); Snd.click();
    modal({
      title: 'Recommencer ?', html: 'Toute la progression sera effacée.',
      buttons: [{ label: 'Oui, tout recommencer', action: () => { S = fresh(); save(); renderTitle(); } }, { label: 'Annuler', primary: true }]
    });
  });
  $('#btn-start').addEventListener('click', () => { Snd.init(); Snd.click(); if (!S.start) { S.start = Date.now(); save(); } renderQuest(); });
  $('#btn-intro-back').addEventListener('click', () => { Snd.click(); renderTitle(); });

  /* ---------- HUD ---------- */
  function renderHud(newSlot) {
    let h = '';
    for (let k = 0; k < 10; k++) h += '<img src="' + (k < S.hearts ? I.heart : I.heartEmpty) + '" alt="">';
    $('#hearts').innerHTML = h;
    $('#xp-level').textContent = Math.min(S.step, QN);
    $('#xp-fill').style.width = (Math.min(S.step, QN) / QN * 100) + '%';
    const items = H.quetes.map((q) => ({ icon: q.objet, name: q.objetNom })).concat([{ icon: 'map', name: 'Carte au trésor' }]);
    const sel = Math.min(S.step, QN) - 1;
    $('#hotbar').innerHTML = items.map((it, k) => {
      const has = k < S.step || (k === QN && S.step >= QN);
      return '<button class="hs' + (k === sel ? ' sel' : '') + (k === newSlot ? ' new' : '') + '" data-name="' + (has ? it.name : '???') + '" aria-label="' + (has ? it.name : 'Emplacement vide') + '">' +
        (has ? '<img src="' + I[it.icon] + '" alt="">' : '') + '</button>';
    }).join('');
  }
  let tipTimer;
  $('#hotbar').addEventListener('click', (e) => {
    const b = e.target.closest('.hs');
    if (!b) return;
    document.querySelectorAll('.tip').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'tip'; t.textContent = b.dataset.name;
    b.appendChild(t);
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => t.remove(), 1600);
  });
  $('#btn-sound').addEventListener('click', () => {
    Snd.on = !Snd.on; Snd.init(); Snd.click();
    try { localStorage.setItem('mc-son', Snd.on ? '1' : '0'); } catch (e) { /* ignore */ }
    renderSound();
  });

  /* ---------- quête ---------- */
  function visual(kind) {
    if (kind === 'eau') {
      return '<div class="gui"><div class="gui-label">Source infinie</div><div class="gui-row">' +
        '<div class="slot"><img src="' + I.bucket + '" alt="Seau d\'eau"></div><span class="op">+</span>' +
        '<div class="slot"><img src="' + I.bucket + '" alt="Seau d\'eau"></div><span class="op">=</span>' +
        '<div class="slot big"><img src="' + I.water + '" alt="Eau"></div><span class="inf">∞</span></div></div>';
    }
    if (kind === 'craft') {
      let g = '';
      for (let k = 0; k < 9; k++) g += k === 4 ? '<div class="slot"></div>' : '<div class="slot"><img src="' + I.cobble + '" alt="Pierre taillée"></div>';
      const done = S.step > 2;
      return '<div class="gui"><div class="gui-label">Fabrication</div><div class="gui-row"><div class="grid3">' + g + '</div>' +
        '<img class="arrow" src="' + I.arrow + '" alt="donne">' +
        '<div class="slot big result">' + (done ? '<img src="' + I.furnace + '" alt="Four">' : '<span>?</span>') + '</div></div></div>';
    }
    return '';
  }
  function renderHints() {
    const i = S.step, q = H.quetes[i], n = S.hints[i] || 0, total = (q.indices || []).length;
    $('#q-hints').innerHTML = (q.indices || []).slice(0, n).map((h, k) => '<div class="hint"><span class="k">Indice ' + (k + 1) + '</span>' + h + '</div>').join('');
    const b = $('#btn-hint');
    b.hidden = total === 0;
    b.disabled = n >= total;
    b.innerHTML = '<img src="' + I.torch + '" alt="">' + (n >= total ? 'Plus d\'indice' : 'Indice (' + (total - n) + ' restant' + (total - n > 1 ? 's' : '') + ')');
  }
  function renderQuest() {
    const i = S.step, q = H.quetes[i];
    $('#quest-label').textContent = 'Quête ' + (i + 1) + '/' + QN;
    $('#q-num').textContent = 'Énigme ' + (i + 1);
    $('#q-title').textContent = q.titre;
    $('#q-visual').innerHTML = visual(q.visuel);
    $('#q-text').innerHTML = q.enigme.map((p) => '<p>' + p + '</p>').join('');
    renderHints();
    $('#q-question').innerHTML = q.question;
    const isBtn = q.type === 'bouton';
    $('#answer-form').hidden = isBtn;
    $('#btn-confirm').hidden = !isBtn;
    if (isBtn) $('#btn-confirm').textContent = q.bouton;
    $('#fields').innerHTML = champsOf(q).map((c, k) =>
      (c.label ? '<label class="field-label" for="ans' + k + '">' + c.label + '</label>' : '') +
      '<input class="mc-input" id="ans' + k + '" type="text" inputmode="' + (c.clavier === 'numeric' ? 'numeric' : 'text') + '"' +
      ' autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Votre réponse…"' + (c.label ? '' : ' aria-label="Votre réponse"') + '>'
    ).join('');
    $('#feedback').innerHTML = '';
    updateLock();
    renderHud();
    show('s-quest');
  }
  $('#btn-hint').addEventListener('click', () => {
    Snd.init(); Snd.click();
    const i = S.step;
    S.hints[i] = (S.hints[i] || 0) + 1; save();
    renderHints();
    const last = $('#q-hints').lastElementChild;
    if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('#answer-form').addEventListener('submit', (e) => {
    e.preventDefault();
    Snd.init();
    if ((S.lockUntil || 0) > Date.now()) { shake($('#answer-panel')); return; }
    const inputs = Array.from(document.querySelectorAll('#fields input'));
    const empty = inputs.find((el) => !norm(el.value) && !/\d/.test(el.value));
    if (empty) { shake($('#answer-panel')); empty.focus(); return; }
    inputs.forEach((el) => el.blur());
    if (checkAll(inputs.map((el) => el.value), H.quetes[S.step])) success(); else fail();
  });
  $('#btn-confirm').addEventListener('click', () => {
    Snd.init(); Snd.click();
    modal({
      title: 'Vous êtes au spawn ?',
      html: 'Vous êtes vraiment rentrés à la maison ?<br>La carte au trésor va apparaître…',
      buttons: [{ label: 'Oui, on y est !', primary: true, action: success }, { label: 'Pas encore' }]
    });
  });
  function shake(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
  const HMM = ["Hmm… Ce n'est pas ça.", 'Hrmm ! Mauvaise réponse.', 'Hmm hmm… Regardez mieux autour de vous !', 'Hrrm… Toujours pas !', 'Hmm… Vous êtes au bon endroit ?'];
  function fail() {
    S.wrong++; S.hearts = Math.max(0, S.hearts - 1); S.lockUntil = Date.now() + ATTENTE; save();
    updateLock();
    Snd.hurt(); setTimeout(() => Snd.hmm(), 150);
    const f = document.createElement('div'); f.className = 'hurt-flash'; document.body.appendChild(f); setTimeout(() => f.remove(), 500);
    shake($('#answer-panel'));
    const several = champsOf(H.quetes[S.step]).length > 1;
    $('#feedback').innerHTML = '<div class="chat"><img src="' + I.villager + '" alt=""><span><span class="who">&lt;Villageois&gt;</span> ' +
      (several ? 'Hrmm… Au moins une réponse est fausse !' : HMM[S.wrong % HMM.length]) + ' Réfléchissez ' + Math.round(ATTENTE / 1000) + ' secondes…</span></div>';
    renderHud();
    $('#hearts').classList.remove('blink'); void $('#hearts').offsetWidth; $('#hearts').classList.add('blink');
    if (S.hearts <= 0) setTimeout(death, 800);
  }
  function death() {
    S.deaths++; save();
    $('#dead-score').textContent = S.step * 100 + S.hints.reduce((a, b) => a + b, 0) * 7;
    show('s-dead');
  }
  $('#btn-respawn').addEventListener('click', () => { Snd.init(); Snd.click(); S.hearts = 10; save(); renderQuest(); });

  function success() {
    const i = S.step, q = H.quetes[i];
    S.step++; S.hearts = Math.min(10, S.hearts + 2); S.lockUntil = 0; save();
    clearTimeout(lockTimer);
    Snd.levelup();
    for (let k = 0; k < 4; k++) setTimeout(() => Snd.orb(), 450 + k * 110);
    toast('Progrès réalisé !', q.progres, q.objet);
    renderHud(i);
    const last = S.step >= QN;
    modal({
      title: 'Objet obtenu !',
      html: '<div class="obtain"><div class="slot"><img src="' + I[q.objet] + '" alt=""></div><div class="obtain-name">' + q.objetNom + '</div>' +
        '<div class="obtain-sub">' + (last ? 'Toutes les quêtes sont terminées !' : 'Quête ' + (S.step + 1) + ' débloquée !') + '</div></div>',
      buttons: [{ label: last ? 'Ouvrir la carte au trésor' : 'Quête suivante', primary: true, action: last ? startLoading : renderQuest }]
    });
  }

  // Maître du Jeu : 5 tapes rapides sur « Quête X/5 » pour passer l'étape
  let taps = [];
  $('#quest-label').addEventListener('click', () => {
    const now = Date.now();
    taps = taps.filter((t) => now - t < 3000); taps.push(now);
    if (taps.length >= 5) {
      taps = [];
      modal({
        title: 'Mode ' + H.maitre, html: 'Passer la quête « ' + H.quetes[S.step].titre + ' » ?',
        buttons: [{ label: 'Oui, valider la quête', primary: true, action: success }, { label: 'Annuler' }]
      });
    }
  });

  /* ---------- chargement → carte ---------- */
  function startLoading() {
    show('s-loading');
    const msgs = ['Construction du terrain', 'Plantation des arbres', 'Taille des haies', 'Enterrement du trésor', 'Dessin de la carte'];
    const t0 = performance.now(), dur = 3400;
    (function tick(now) {
      const k = Math.min(1, (now - t0) / dur);
      $('#load-fill').style.width = (k * 100) + '%';
      $('#load-pct').textContent = Math.floor(k * 100) + '%';
      $('#load-msg').textContent = msgs[Math.min(msgs.length - 1, Math.floor(k * msgs.length))];
      if (k < 1) requestAnimationFrame(tick); else setTimeout(renderMap, 300);
    })(t0);
  }
  let mapView = null;
  function renderMap() {
    show('s-map');
    if (mapView) mapView.stop();
    $('#map-wrap').classList.remove('revealed');
    $('#btn-found').disabled = true;
    $('#map-labels').innerHTML = G.LABELS.map((l) =>
      '<span class="map-label" style="left:' + (l.x / G.MAP_W * 100) + '%;top:' + (l.y / G.MAP_H * 100) + '%">' + l.t + '</span>').join('');
    mapView = G.MapView($('#map'), {
      treasure: H.tresor, duration: 2800,
      onTick: () => Snd.tick(),
      onRevealed: () => {
        $('#map-wrap').classList.add('revealed');
        $('#btn-found').disabled = false;
        Snd.levelup();
        toast('Objectif atteint !', 'Carte au trésor', 'map');
      }
    });
  }
  $('#btn-found').addEventListener('click', () => {
    Snd.init(); Snd.click();
    modal({
      title: 'Le trésor ?!',
      html: 'Vous avez <b>vraiment</b> le trésor entre les mains ?',
      buttons: [{ label: "Oui, on l'a !", primary: true, action: renderWin }, { label: 'Pas encore…' }]
    });
  });

  /* ---------- victoire ---------- */
  const FW = (function () {
    let cv, x, parts = [], on = false, last = 0, dpr = 1;
    const cols = ['#ff5555', '#ffff55', '#55ff55', '#55ffff', '#5555ff', '#ff55ff', '#ffaa00', '#ffffff'];
    function resize() { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = window.innerWidth * dpr; cv.height = window.innerHeight * dpr; }
    function burst() {
      const cx = (0.12 + Math.random() * 0.76) * cv.width, cy = (0.1 + Math.random() * 0.4) * cv.height;
      const c1 = cols[Math.floor(Math.random() * cols.length)], c2 = cols[Math.floor(Math.random() * cols.length)];
      for (let k = 0; k < 50; k++) {
        const a = Math.random() * Math.PI * 2, s = (1.5 + Math.random() * 3.5) * dpr;
        parts.push({ x: cx, y: cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, c: k % 2 ? c1 : c2 });
      }
      Snd.boom();
    }
    function frame(now) {
      if (!on) return;
      if (now - last > 800) { last = now; burst(); }
      x.clearRect(0, 0, cv.width, cv.height);
      const sz = Math.round(4 * dpr);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.06 * dpr; p.vx *= 0.985; p.life -= 0.012;
        x.globalAlpha = Math.max(0, p.life); x.fillStyle = p.c;
        x.fillRect(Math.round(p.x / sz) * sz, Math.round(p.y / sz) * sz, sz, sz);
      }
      x.globalAlpha = 1;
      requestAnimationFrame(frame);
    }
    return {
      start() { cv = $('#fw'); x = cv.getContext('2d'); resize(); if (!on) { on = true; requestAnimationFrame(frame); } },
      stop() { on = false; parts = []; }
    };
  })();
  function renderWin() {
    const first = !S.found;
    if (first) { S.found = true; S.end = Date.now(); save(); }
    if (mapView) { mapView.stop(); mapView = null; }
    $('#win-text').textContent = 'Bravo ' + H.equipe + ' ! Vous avez résolu toutes les énigmes et trouvé le trésor du village.';
    const hints = S.hints.reduce((a, b) => a + b, 0);
    const rows = [['Temps total', S.start && S.end ? fmt(S.end - S.start) : '—'], ['Indices utilisés', hints], ['Mauvaises réponses', S.wrong], ['Morts', S.deaths]];
    $('#win-stats').innerHTML = rows.map((r) => '<div class="row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('');
    show('s-win');
    FW.start();
    Snd.fanfare();
    toast('Défi relevé !', 'Chasseurs de trésor', 'chest', 'challenge');
  }
  $('#btn-win-title').addEventListener('click', () => { Snd.click(); renderTitle(); });

  /* ---------- démarrage ---------- */
  renderSound();
  renderTitle();
})();
