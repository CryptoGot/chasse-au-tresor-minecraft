/* Graphismes procéduraux « style Minecraft » :
   textures 16×16, icônes d'objets, panorama de l'écran titre, carte du jardin */
(function () {
  'use strict';

  /* ---------- aléatoire déterministe ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(n) {
    n = (n << 13) ^ n;
    const v = (Math.imul(n, (Math.imul(Math.imul(n, n), 15731) + 789221) | 0) + 1376312589) & 0x7fffffff;
    return v / 0x7fffffff;
  }
  function vnoise(x, seed) {
    const i = Math.floor(x), f = x - i;
    const a = hash(i + seed * 9973), b = hash(i + 1 + seed * 9973);
    const s = f * f * (3 - 2 * f);
    return a + (b - a) * s;
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, v + amt));
    return 'rgb(' + c(n >> 16) + ',' + c((n >> 8) & 255) + ',' + c(n & 255) + ')';
  }

  const TEX = {}, ICON = {};
  const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function dot(x, i, j, c) { x.fillStyle = c; x.fillRect(i, j, 1, 1); }
  function tex(name, seed, paint) { const c = cnv(16), x = c.getContext('2d'); paint(x, rng(seed)); TEX[name] = c; }
  function noise(x, r, pal) { for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) dot(x, i, j, pick(r, pal)); }
  function sprinkle(x, r, n, pal) { for (let k = 0; k < n; k++) dot(x, Math.floor(r() * 16), Math.floor(r() * 16), pick(r, pal)); }
  function blobs(x, r, n, pal, size) {
    for (let k = 0; k < n; k++) {
      const cx = Math.floor(r() * 16), cy = Math.floor(r() * 16);
      for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) {
        if (size > 2 && (dx === 0 || dx === size - 1) && (dy === 0 || dy === size - 1)) continue;
        dot(x, (cx + dx) % 16, (cy + dy) % 16, pick(r, pal));
      }
    }
  }
  function border(x, light, dark) {
    for (let i = 0; i < 16; i++) { dot(x, i, 0, light); dot(x, 0, i, light); dot(x, i, 15, dark); dot(x, 15, i, dark); }
  }
  function voronoi(x, r, n, pal, edge) {
    const pts = [];
    for (let k = 0; k < n; k++) pts.push([r() * 16, r() * 16, pick(r, pal)]);
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      let d1 = 1e9, d2 = 1e9, best = 0;
      for (let k = 0; k < n; k++) {
        let dx = Math.abs(i + 0.5 - pts[k][0]); dx = Math.min(dx, 16 - dx);
        let dy = Math.abs(j + 0.5 - pts[k][1]); dy = Math.min(dy, 16 - dy);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < d1) { d2 = d1; d1 = d; best = k; } else if (d < d2) d2 = d;
      }
      dot(x, i, j, d2 - d1 < 0.9 ? edge : (r() < 0.3 ? shade(pts[best][2], r() < 0.5 ? -14 : 14) : pts[best][2]));
    }
  }
  function planks(x, r, pal, line) {
    for (let row = 0; row < 4; row++) {
      const base = pick(r, pal);
      for (let j = row * 4; j < row * 4 + 4; j++) for (let i = 0; i < 16; i++) {
        dot(x, i, j, j % 4 === 3 ? line : (r() < 0.3 ? pick(r, pal) : base));
      }
      const seam = (row * 7 + 3) % 16;
      for (let j = row * 4; j < row * 4 + 3; j++) dot(x, seam, j, line);
    }
  }

  const P = {
    grass: ['#5b9c3a', '#62a53f', '#6db446', '#559434', '#4e8a2f', '#69ad42'],
    dirt: ['#866043', '#79553a', '#966c4a', '#6c4b31', '#8c6446'],
    stone: ['#7f7f7f', '#878787', '#747474', '#8f8f8f', '#6b6b6b'],
    cobble: ['#8a8a8a', '#7a7a7a', '#9a9a9a', '#6e6e6e', '#a3a3a3'],
    leaves: ['#2f6b1d', '#3b7d24', '#478f2c', '#336f20', '#3f8527'],
    willow: ['#7e9f3c', '#8dae47', '#6f8f33', '#9cbc56', '#86a742'],
    hedge: ['#2a5a1e', '#336b24', '#2e6221', '#3a7529'],
    terrace: ['#6f747a', '#757a80', '#6a6f75', '#7b8086'],
    gravel: ['#b5a487', '#a69477', '#c4b496', '#8f7f66', '#bcae92', '#9b8a6d'],
    planks: ['#b8945f', '#af8b56', '#a3804e', '#bf9a63'],
    birch: ['#d7c185', '#cdb77b', '#c4ad72', '#dcc88e'],
    log: ['#6b5230', '#5a4426', '#735936', '#4f3b20'],
    woolW: ['#e9ecec', '#dfe3e3', '#f2f4f4', '#d5d9d9'],
    woolG: ['#5a5f63', '#62676b', '#53585c', '#6a6f73'],
    black: ['#1b1b1f', '#222226', '#2a2a2e', '#18181b'],
    metal: ['#8d9196', '#9aa0a5', '#80858a', '#a5aaaf'],
    rust: ['#8a4a22', '#9e5a2b', '#7a3e1a', '#b06a35', '#6e3616'],
    dark: ['#2b2b2b', '#353535', '#222222', '#3c3c3c'],
    red: ['#b3261e', '#c42d24', '#a3211a', '#ba2a21'],
    green: ['#3f5a24', '#4a682b', '#365020', '#527331'],
    roof: ['#3a3a3c', '#424244', '#353537', '#46464a'],
    olive: ['#7d8f6a', '#8a9c75', '#6f805c', '#94a67e', '#65744f'],
    water: ['#3a5fd6', '#3f67e0', '#365ad0', '#4570e6'],
    sand: ['#dbcf9b', '#e3d7a3', '#d2c58f', '#e8dcaa'],
    gold: ['#f8d43a', '#fce55c', '#e6b82a', '#fff07a', '#d9a51f'],
    paper: ['#efe3c0', '#ebdeb8', '#f2e7c7', '#e6d8af'],
    parch: ['#d8c99b', '#d2c292', '#ddd0a6', '#cdbd8b'],
    btn: ['#8b8b8b', '#858585', '#919191', '#7f7f7f', '#888888']
  };

  function ore(name, seed, cols) {
    tex(name, seed, (x, r) => {
      noise(x, r, P.stone);
      for (let k = 0; k < 5; k++) {
        const cx = 1 + Math.floor(r() * 13), cy = 1 + Math.floor(r() * 13);
        dot(x, cx, cy, cols[0]); dot(x, cx + 1, cy, cols[1]); dot(x, cx, cy + 1, cols[1]);
        if (r() < 0.6) dot(x, cx + 1, cy + 1, cols[0]);
      }
    });
  }

  function makeTextures() {
    tex('grass', 1, (x, r) => { noise(x, r, P.grass); sprinkle(x, r, 10, ['#77bf4f', '#4a842c']); });
    tex('dirt', 2, (x, r) => { noise(x, r, P.dirt); sprinkle(x, r, 8, ['#5e4029', '#a07650']); });
    tex('grassSide', 3, (x, r) => {
      noise(x, r, P.dirt);
      for (let i = 0; i < 16; i++) {
        const d = 3 + (r() < 0.5 ? 1 : 0) + (r() < 0.2 ? 1 : 0);
        for (let j = 0; j < d; j++) dot(x, i, j, pick(r, P.grass));
      }
    });
    tex('stone', 4, (x, r) => { noise(x, r, P.stone); blobs(x, r, 5, ['#6a6a6a', '#959595'], 2); });
    tex('cobble', 5, (x, r) => voronoi(x, r, 8, P.cobble, '#4a4a4a'));
    tex('terrace', 6, (x, r) => { noise(x, r, P.terrace); border(x, '#8a8f95', '#4f5358'); });
    tex('bricks', 7, (x, r) => {
      noise(x, r, P.stone);
      for (let i = 0; i < 16; i++) { dot(x, i, 7, '#5c5c5c'); dot(x, i, 15, '#5c5c5c'); }
      for (let j = 0; j < 7; j++) dot(x, 15, j, '#5c5c5c');
      for (let j = 8; j < 15; j++) dot(x, 7, j, '#5c5c5c');
    });
    tex('gravel', 8, (x, r) => { noise(x, r, P.gravel); sprinkle(x, r, 14, ['#7a6b55', '#d6c8aa']); });
    tex('planks', 9, (x, r) => planks(x, r, P.planks, '#7a5c34'));
    tex('birch', 10, (x, r) => planks(x, r, P.birch, '#a48f5c'));
    tex('log', 11, (x, r) => {
      for (let i = 0; i < 16; i++) { const c = pick(r, P.log); for (let j = 0; j < 16; j++) dot(x, i, j, r() < 0.8 ? c : pick(r, P.log)); }
      for (let k = 0; k < 4; k++) { const i = Math.floor(r() * 16); for (let j = 0; j < 16; j++) if (r() < 0.7) dot(x, i, j, '#3f2f19'); }
    });
    tex('leaves', 12, (x, r) => { noise(x, r, P.leaves); sprinkle(x, r, 22, ['#1f4a12', '#24561a']); sprinkle(x, r, 8, ['#5aa23a']); });
    tex('willow', 13, (x, r) => {
      for (let i = 0; i < 16; i++) { const base = pick(r, P.willow); for (let j = 0; j < 16; j++) dot(x, i, j, r() < 0.7 ? base : pick(r, P.willow)); }
      sprinkle(x, r, 14, ['#5c7a2a', '#4f6b22']); sprinkle(x, r, 6, ['#b5d070']);
    });
    tex('hedge', 14, (x, r) => { noise(x, r, P.hedge); sprinkle(x, r, 16, ['#1e4515', '#447f30']); });
    tex('roses', 15, (x, r) => {
      noise(x, r, P.hedge); sprinkle(x, r, 10, ['#1e4515']);
      blobs(x, r, 7, ['#f6f6f2', '#e9e9e2', '#ffffff'], 2); sprinkle(x, r, 4, ['#f1e27a']);
    });
    tex('tallgrass', 16, (x, r) => {
      noise(x, r, P.dirt);
      for (let k = 0; k < 11; k++) {
        const i = Math.floor(r() * 16), top = Math.floor(r() * 7);
        const c = pick(r, ['#9fb05a', '#b3b86b', '#7f9a48', '#c9c27e', '#8aa04e']);
        for (let j = top; j < 16; j++) dot(x, i, j, c);
      }
    });
    tex('hydrangea', 17, (x, r) => { noise(x, r, ['#3f6e2a', '#4a7a32', '#365f24']); blobs(x, r, 6, ['#d9a0a6', '#c98389', '#b98a62', '#e6bcc0', '#a9765a'], 3); });
    tex('flowersW', 18, (x, r) => { noise(x, r, P.grass); sprinkle(x, r, 20, ['#f5f5f5', '#efe6ef', '#ffffff']); sprinkle(x, r, 5, ['#e8a0c0']); });
    tex('lavender', 19, (x, r) => { noise(x, r, ['#7d8f73', '#8a9a80', '#6f8066']); sprinkle(x, r, 18, ['#8b6bb5', '#9d7fc6', '#7a5aa3']); });
    tex('woolW', 20, (x, r) => noise(x, r, P.woolW));
    tex('woolG', 21, (x, r) => noise(x, r, P.woolG));
    tex('mat', 22, (x, r) => noise(x, r, P.black));
    tex('metal', 23, (x, r) => { noise(x, r, P.metal); border(x, '#c0c4c8', '#5f6368'); });
    tex('bbq', 24, (x, r) => {
      noise(x, r, P.rust);
      for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
        const d = Math.hypot(i - 7.5, j - 7.5);
        if (d < 5.5) dot(x, i, j, j % 2 === 0 ? '#555555' : '#1e1e1e');
        else if (d < 6.5) dot(x, i, j, '#2a2a2a');
      }
    });
    tex('dark', 25, (x, r) => {
      noise(x, r, P.dark);
      for (let j = 5; j < 11; j++) for (let i = 5; i < 11; i++) dot(x, i, j, pick(r, ['#c45a1a', '#e07a22', '#8a3a12']));
    });
    tex('mower', 26, (x, r) => {
      noise(x, r, P.red);
      for (let j = 5; j < 11; j++) for (let i = 4; i < 10; i++) dot(x, i, j, '#1e1e1e');
      [[0, 0], [0, 13], [13, 0], [13, 13]].forEach(([a, b]) => { for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) dot(x, a + i, b + j, '#111111'); });
    });
    tex('barrow', 27, (x, r) => {
      noise(x, r, P.green); border(x, '#26381a', '#26381a');
      for (let j = 6; j < 10; j++) for (let i = 6; i < 10; i++) dot(x, i, j, '#e0b020');
    });
    tex('roof', 28, (x, r) => {
      noise(x, r, P.roof);
      for (let i = 0; i < 16; i++) { dot(x, i, 7, '#2a2a2c'); dot(x, i, 15, '#2a2a2c'); }
      for (let j = 0; j < 8; j++) dot(x, 7, j, '#2a2a2c');
      for (let j = 8; j < 16; j++) dot(x, 15, j, '#2a2a2c');
    });
    tex('swing', 29, (x, r) => {
      noise(x, r, P.grass);
      for (let j = 6; j < 10; j++) for (let i = 0; i < 16; i++) dot(x, i, j, pick(r, ['#8a6a3f', '#9c7a4a', '#7d5f36']));
      for (let j = 3; j < 13; j++) { dot(x, 2, j, '#5e4527'); dot(x, 3, j, '#5e4527'); dot(x, 12, j, '#5e4527'); dot(x, 13, j, '#5e4527'); }
    });
    tex('olive', 30, (x, r) => { noise(x, r, P.olive); sprinkle(x, r, 14, ['#4f5c3d', '#a9b893']); });
    tex('water', 31, (x, r) => {
      noise(x, r, P.water);
      for (let k = 0; k < 5; k++) { const j = Math.floor(r() * 16), i0 = Math.floor(r() * 12); for (let i = i0; i < i0 + 4; i++) dot(x, i % 16, j, '#6f95f0'); }
    });
    tex('sand', 32, (x, r) => noise(x, r, P.sand));
    tex('gold', 33, (x, r) => { noise(x, r, P.gold); border(x, '#fff6a8', '#b8860b'); });
    tex('stoneLogo', 34, (x, r) => noise(x, r, ['#9a9a9a', '#a8a8a8', '#8c8c8c', '#b4b4b4', '#7d7d7d']));
    tex('paper', 35, (x, r) => noise(x, r, P.paper));
    tex('btn', 36, (x, r) => noise(x, r, P.btn));
    tex('parchment', 37, (x, r) => { noise(x, r, P.parch); sprinkle(x, r, 6, ['#c4b27c']); });
    ore('coal', 40, ['#1f1f1f', '#3a3a3a']);
    ore('iron', 41, ['#d8af93', '#b98d70']);
    ore('diamond', 42, ['#4ae8e0', '#2bb8b0']);
    tex('furnaceTop', 43, (x, r) => { noise(x, r, P.stone); border(x, '#9a9a9a', '#555555'); });
    tex('tntTop', 44, (x, r) => {
      noise(x, r, ['#c9341f', '#b02b19', '#d43d26']);
      for (let j = 5; j < 11; j++) for (let i = 5; i < 11; i++) dot(x, i, j, '#8a8a8a');
      for (let j = 7; j < 9; j++) for (let i = 7; i < 9; i++) dot(x, i, j, '#1d1d1d');
    });
    tex('chestTop', 45, (x, r) => { noise(x, r, ['#a8732e', '#9a6828', '#b27b33']); border(x, '#2b1a0a', '#2b1a0a'); });
  }

  /* ---------- sprites pixel-art ---------- */
  function sprite(rows, pal) {
    const h = rows.length, w = rows[0].length, c = cnv(w, h), x = c.getContext('2d');
    rows.forEach((row, j) => {
      if (row.length !== w) console.warn('sprite: ligne de taille', row.length, row);
      for (let i = 0; i < w; i++) { const ch = row[i]; if (ch !== '.' && pal[ch]) dot(x, i, j, pal[ch]); }
    });
    return c;
  }
  const SPR = {
    bucket: [[
      '................', '.....kkkkkk.....', '....k......k....', '...k........k...',
      '..kkkkkkkkkkkk..', '..kgbbbbbbbbgk..', '..kgbwwbbbbBgk..', '..kkkkkkkkkkkk..',
      '...kggGGGGddk...', '...kgGGGGGddk...', '...kgGGGGGddk...', '....kgGGGGdk....',
      '....kgGGGGdk....', '....kgGGGddk....', '.....kkkkkk.....', '................'
    ], { k: '#2b2b2b', g: '#d6d6d6', G: '#a8a8a8', d: '#6d6d6d', b: '#3f76e4', B: '#2c5bc4', w: '#9cc2ff' }],
    door: [[
      '...kkkkkkkkkk...', '...k' + 'oooooooo' + 'k...', '...kowwoowwok...', '...kowwoowwok...',
      '...k' + 'oooooooo' + 'k...', '...kowwoowwok...', '...kowwoowwok...', '...k' + 'oooooooo' + 'k...',
      '...kOOOOOOOOk...', '...kOooooooOk...', '...kOooooohOk...', '...kOooooooOk...',
      '...kOooooooOk...', '...kOooooooOk...', '...kOOOOOOOOk...', '...kkkkkkkkkk...'
    ], { k: '#3b2a14', o: '#b8945f', O: '#8f6d3e', w: '#bfe0f7', h: '#2b2b2b' }],
    bed: [[
      '................', '................', '................', '................',
      '................', '.wwwwrrrrrrrrrr.', '.wWWwrrrrrrrrrr.', '.rrrrrrrrrrrrrr.',
      '.RRRRRRRRRRRRRR.', '.oooooooooooooo.', '.OOOOOOOOOOOOOO.', '.OO..........OO.',
      '.OO..........OO.', '................', '................', '................'
    ], { w: '#f0f0f0', W: '#c9c9c9', r: '#c0282d', R: '#8e1b1f', o: '#a3804e', O: '#6b5030' }],
    map: [[
      '................', '.kkkkkkkkkkkkkk.', '.kppPppppppPppk.', '.kpggppPppppbpk.',
      '.kpgggpppppbbpk.', '.kpppppPppppppk.', '.kPpppppppgggpk.', '.kppbbppppggppk.',
      '.kpbbbppxpxpppk.', '.kppbpppPxppPpk.', '.kpppppPxpxpppk.', '.kpggpppppppPpk.',
      '.kpgggppPpppppk.', '.kppppppppPpppk.', '.kkkkkkkkkkkkkk.', '................'
    ], { k: '#3f2a14', p: '#e8d7a5', P: '#d4bf86', g: '#6b8f3a', b: '#4a7bd0', x: '#c0281e' }],
    torch: [[
      '................', '................', '.......yy.......', '......yYYy......',
      '......yYYy......', '.......oo.......', '.......bB.......', '.......bB.......',
      '.......bB.......', '.......bB.......', '.......bB.......', '.......bB.......',
      '.......bB.......', '.......bB.......', '.......bB.......', '................'
    ], { y: '#ffd84a', Y: '#fff7c2', o: '#ff9a1f', b: '#8a6a3f', B: '#6b5030' }],
    heart: [['.kk.kk.', 'krwrrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'], { k: '#1a0505', r: '#e3262b', w: '#ff9c9c' }],
    heartEmpty: [['.kk.kk.', 'keeeeek', 'keeeeek', '.keeek.', '..kek..', '...k...'], { k: '#1a0505', e: '#3a2a2a' }],
    villager: [['BbbbbbbB', 'bbbbbbbb', 'bbbbbbbb', 'bkkkkkkb', 'bwgnngwb', 'bbbnnbbb', 'bbmnnmbb', 'bbbnnbbb'],
      { b: '#bd8b72', B: '#a8765d', k: '#4a2f22', w: '#ffffff', g: '#2f8f3a', n: '#a46a52', m: '#6b3f2f' }],
    arrow: [['......k...', '......kk..', 'kkkkkkkkk.', 'kkkkkkkkkk', 'kkkkkkkkk.', '......kk..', '......k...'], { k: '#8b8b8b' }],
    furnaceFront: [[
      'kkkkkkkkkkkkkkkk', 'klglGglglGlglglk', 'kgGgggGgGggGgGgk', 'kllglglgllglglGk',
      'kGGGGGGGGGGGGGGk', 'kgGddddddddddGgk', 'kgdkkkkkkkkkkdgk', 'kgdkrfrkkrfrkdgk',
      'kgdrfFfrrfFfrdgk', 'kgdfFFFffFFFfdgk', 'kgGddddddddddGgk', 'kGGGGGGGGGGGGGGk',
      'klglgGlglgGlglgk', 'kgGgGggGgGgGgGgk', 'kllgGlglglgGlglk', 'kkkkkkkkkkkkkkkk'
    ], { k: '#3a3a3a', g: '#8a8a8a', G: '#6e6e6e', l: '#a5a5a5', d: '#4a4a4a', f: '#ff9b2f', F: '#ffd23f', r: '#d9541e' }],
    tntSide: [[
      'rrRrrRrrRrrRrrRr', 'rrRrrRrrRrrRrrRr', 'rrRrrRrrRrrRrrRr', 'rrRrrRrrRrrRrrRr',
      'rrRrrRrrRrrRrrRr', 'wwwwwwwwwwwwwwww', 'wwkkkwkwwkwkkkww', 'wwwkwwkkwkwwkwww',
      'wwwkwwkwkkwwkwww', 'wwwkwwkwwkwwkwww', 'wwwwwwwwwwwwwwww', 'rrRrrRrrRrrRrrRr',
      'rrRrrRrrRrrRrrRr', 'rrRrrRrrRrrRrrRr', 'rrRrrRrrRrrRrrRr', 'rrRrrRrrRrrRrrRr'
    ], { r: '#db2b1c', R: '#a51d12', w: '#f2f2f2', k: '#1d1d1d' }],
    chestFront: [[
      'kkkkkkkkkkkkkkkk', 'klllllllllllllOk', 'kloooooooooooOOk', 'kloooooooooooOOk',
      'kOOOOOOOOOOOOOOk', 'kkkkkkkggkkkkkkk', 'kloooooGGooooOOk', 'kloooooooooooOOk',
      'kloooooooooooOOk', 'kloooooooooooOOk', 'kloooooooooooOOk', 'kloooooooooooOOk',
      'kloooooooooooOOk', 'kOOOOOOOOOOOOOOk', 'kOOOOOOOOOOOOOOk', 'kkkkkkkkkkkkkkkk'
    ], { k: '#2b1a0a', l: '#c58b3f', o: '#a8732e', O: '#7c5220', g: '#d8d8d8', G: '#6a6a6a' }]
  };

  function creeper() {
    const pat = ['gggggggg', 'gggggggg', 'gkkggkkg', 'gkkggkkg', 'gggkkggg', 'ggkkkkgg', 'ggkkkkgg', 'ggkggkgg'];
    const c = cnv(8), x = c.getContext('2d'), r = rng(77);
    pat.forEach((row, j) => { for (let i = 0; i < 8; i++) dot(x, i, j, row[i] === 'k' ? '#111111' : pick(r, ['#5fbf4a', '#4ea83a', '#73cf5e', '#3f8f2e'])); });
    return c;
  }

  function flatIcon(src, size) {
    size = size || 64;
    const c = cnv(size), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    const s = Math.max(1, Math.floor(size / Math.max(src.width, src.height)));
    const w = src.width * s, h = src.height * s;
    x.drawImage(src, Math.floor((size - w) / 2), Math.floor((size - h) / 2), w, h);
    return c;
  }
  function cubeIcon(top, left, right) {
    const c = cnv(64), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    const face = (img, m, dark) => {
      x.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      x.drawImage(img, 0, 0);
      if (dark) { x.fillStyle = 'rgba(0,0,0,' + dark + ')'; x.fillRect(0, 0, 16, 16); }
    };
    face(left, [1.625, 0.8125, 0, 1.875, 6, 17], 0.15);
    face(right, [1.625, -0.8125, 0, 1.875, 32, 30], 0.35);
    face(top, [1.625, -0.8125, 1.625, 0.8125, 6, 17], 0);
    x.setTransform(1, 0, 0, 1, 0, 0);
    return c;
  }

  function makeIcons() {
    const s = (k) => sprite(SPR[k][0], SPR[k][1]);
    ['bucket', 'door', 'bed', 'map', 'torch'].forEach((k) => { ICON[k] = flatIcon(s(k)).toDataURL(); });
    ICON.heart = flatIcon(s('heart'), 28).toDataURL();
    ICON.heartEmpty = flatIcon(s('heartEmpty'), 28).toDataURL();
    ICON.villager = flatIcon(s('villager')).toDataURL();
    ICON.creeper = flatIcon(creeper()).toDataURL();
    ICON.arrow = flatIcon(s('arrow'), 40).toDataURL();
    const chestSide = SPR.chestFront[0].slice();
    chestSide[5] = 'kkkkkkkkkkkkkkkk'; chestSide[6] = 'kloooooooooooOOk';
    ICON.furnace = cubeIcon(TEX.furnaceTop, s('furnaceFront'), TEX.cobble).toDataURL();
    ICON.tnt = cubeIcon(TEX.tntTop, s('tntSide'), s('tntSide')).toDataURL();
    ICON.chest = cubeIcon(TEX.chestTop, s('chestFront'), sprite(chestSide, SPR.chestFront[1])).toDataURL();
    ICON.cobble = cubeIcon(TEX.cobble, TEX.cobble, TEX.cobble).toDataURL();
    ICON.grass = cubeIcon(TEX.grass, TEX.grassSide, TEX.grassSide).toDataURL();
    ICON.water = cubeIcon(TEX.water, TEX.water, TEX.water).toDataURL();
  }

  // Texture → url() CSS, agrandie sans flou (et éventuellement assombrie)
  function url(name, darken, size) {
    size = size || 16;
    const c = cnv(size), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(TEX[name], 0, 0, size, size);
    if (darken) { x.fillStyle = 'rgba(0,0,0,' + darken + ')'; x.fillRect(0, 0, size, size); }
    return 'url(' + c.toDataURL() + ')';
  }

  /* ---------- panorama de l'écran titre ---------- */
  function Panorama(cv) {
    const x = cv.getContext('2d');
    let W = 0, H = 0, B = 32, rows = 0, running = false, t0 = 0, tPaused = 0;
    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.width = Math.round(cv.clientWidth * dpr);
      H = cv.height = Math.round(cv.clientHeight * dpr);
      B = Math.round((cv.clientHeight < 700 ? 34 : 44) * dpr);
      rows = Math.ceil(H / B) + 1;
      x.imageSmoothingEnabled = false;
    }
    const heightAt = (c) => Math.round(vnoise(c * 0.16, 1) * 5 + vnoise(c * 0.05, 2) * 7);
    const treeRaw = (c) => hash(c * 7 + 3) > 0.84;
    function clouds(t) {
      const cs = Math.round(B * 0.75), tc = t * 0.45;
      const k0 = Math.floor(tc / 14) - 1, k1 = k0 + Math.ceil(W / (cs * 14)) + 2;
      x.fillStyle = 'rgba(255,255,255,0.92)';
      for (let k = k0; k <= k1; k++) {
        if (hash(k * 13 + 5) < 0.35) continue;
        const w = 4 + Math.floor(hash(k * 5 + 1) * 7), row = 1 + Math.floor(hash(k * 11 + 2) * 3);
        const px = Math.round((k * 14 + Math.floor(hash(k * 3 + 7) * 5) - tc) * cs);
        x.fillRect(px, (row + 1) * cs, w * cs, cs);
        x.fillRect(px + cs, row * cs, (w - 2) * cs, cs);
      }
    }
    function frame(now) {
      if (!running) return;
      const t = (now - t0) / 1000, off = t * 0.55;
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#6f9cf6'); g.addColorStop(0.6, '#a9cbff'); g.addColorStop(1, '#cfe3ff');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      clouds(t);
      const top = Math.floor(rows * 0.58) - 6, sea = top + 10;
      const c0 = Math.floor(off) - 3, c1 = c0 + Math.ceil(W / B) + 6;
      for (let c = c0; c <= c1; c++) {
        const px = Math.round((c - off) * B), gt = top + (12 - heightAt(c));
        for (let r = Math.min(gt, sea); r < rows; r++) {
          let img;
          if (r < gt) img = TEX.water;
          else if (r < gt + 4) img = gt >= sea ? TEX.sand : (r === gt ? TEX.grassSide : TEX.dirt);
          else { const h = hash(c * 31 + r * 1013); img = h > 0.985 ? TEX.diamond : h > 0.96 ? TEX.iron : h > 0.92 ? TEX.coal : TEX.stone; }
          x.drawImage(img, px, r * B, B + 1, B + 1);
        }
      }
      for (let c = c0; c <= c1; c++) {
        if (!treeRaw(c) || treeRaw(c - 1) || treeRaw(c - 2)) continue;
        const gt = top + (12 - heightAt(c));
        if (gt >= sea) continue;
        const px = (c - off) * B;
        for (let k = 1; k <= 4; k++) x.drawImage(TEX.log, Math.round(px), (gt - k) * B, B + 1, B + 1);
        for (let rr = gt - 6; rr <= gt - 4; rr++) for (let dc = -2; dc <= 2; dc++) {
          if (rr === gt - 6 && Math.abs(dc) === 2) continue;
          x.drawImage(TEX.leaves, Math.round(px + dc * B), rr * B, B + 1, B + 1);
        }
        for (let dc = -1; dc <= 1; dc++) x.drawImage(TEX.leaves, Math.round(px + dc * B), (gt - 7) * B, B + 1, B + 1);
      }
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', () => { if (running) resize(); });
    return {
      start() { if (running) return; resize(); running = true; t0 = performance.now() - tPaused; requestAnimationFrame(frame); },
      stop() { if (!running) return; running = false; tPaused = performance.now() - t0; }
    };
  }

  /* ---------- carte du jardin (vue de dessus, 1 caractère = 1 bloc) ----------
     haut = fond du jardin, bas = la maison                                    */
  const MAP = [
    'LLLLLLLLLLLLLLLLLLLLLL',
    'LLLLLLLLLLLLLLLLLLLLLL',
    'LLLLLLLggLLLLLLLLLLLLL',
    'LLLLggeeeggLLLLLLggLLL',
    'LLLgggggggggLLLWWWWWgg',
    'LLggggggggggggWWWWWWWg',
    'LggggggggggggWWWWWWWWW',
    'LggggggggLLLgWWWWWWWWW',
    'ggggggggLLLLgWWWWWWWWW',
    'gggBggggLLLggWWWWWWWWW',
    'KKKKKggggggggWWWWWWWWW',
    'KkkkKsuuusggggWWWWWWWg',
    'KkkkKsuxuwgbgmmWWWWWgg',
    'KKKKKsuuussgggghhhhhhg',
    'ssssssssssxggghrrrrrrh',
    'ssosososssssgghrrrrrrh',
    'soOOOOOossxsgghrrrrrrh',
    'ssosososssnsggghhhhhhg',
    'ssssssssssssgggggggggg',
    'ttyyssssssppcccccccccc',
    'tyyyffttppppvvvvvvvvvv',
    'ttyyyyftapppvvvvvvvvvv',
    'tyyyyyyfapppvvvvvvvvvv',
    'ftyyyyyfaapppvvvvivvvv',
    'fftyyyyytapppvvvviivvv',
    'tffyyyytaapppvvvvvvvvv',
    'ttffyyttfaapppvvvvvvvv',
    'tttfftttaaapppvvvvvvvv',
    'RRRRRRRRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRRRRRRRR'
  ];
  const MAP_W = MAP[0].length, MAP_H = MAP.length;
  MAP.forEach((r, j) => { if (r.length !== MAP_W) console.warn('carte: ligne', j, 'taille', r.length); });
  const KEY = {
    L: 'leaves', W: 'willow', h: 'hedge', r: 'roses', B: 'hedge', i: 'olive', g: 'grass', s: 'terrace', p: 'bricks',
    c: 'cobble', v: 'gravel', d: 'dirt', t: 'tallgrass', y: 'hydrangea', f: 'flowersW', a: 'lavender', k: 'mat',
    K: 'metal', O: 'planks', o: 'birch', w: 'woolW', u: 'woolG', b: 'bbq', x: 'dark', m: 'mower', n: 'barrow',
    R: 'roof', e: 'swing'
  };
  const HEIGHT = { L: 6, W: 6, h: 3, r: 3, B: 3, i: 3, w: 4, b: 2, x: 2, m: 2, u: 2, O: 2, o: 1, n: 1 };
  const GROUND = { u: 's', x: 's', w: 's', o: 's', O: 's', n: 's' };
  const PLAYER = { x: 12, y: 27 };
  const LABELS = [
    { t: 'Saule pleureur', x: 17.5, y: 8 },
    { t: 'Trampoline', x: 2.5, y: 12 },
    { t: 'Terrasse', x: 6, y: 18.5 },
    { t: 'Gravier', x: 17, y: 21.5 },
    { t: 'Maison', x: 5.5, y: 29 }
  ];

  function buildMap() {
    const c = cnv(MAP_W * 16, MAP_H * 16), x = c.getContext('2d');
    const each = (fn) => { for (let j = 0; j < MAP_H; j++) for (let i = 0; i < MAP_W; i++) fn(MAP[j][i], i, j); };
    each((ch, i, j) => { const base = HEIGHT[ch] ? (GROUND[ch] || 'g') : ch; x.drawImage(TEX[KEY[base]], i * 16, j * 16); });
    x.fillStyle = 'rgba(0,0,0,0.28)';
    each((ch, i, j) => { if (HEIGHT[ch]) { const o = Math.min(6, HEIGHT[ch]); x.fillRect(i * 16 + o, j * 16 + o, 16, 16); } });
    each((ch, i, j) => { if (HEIGHT[ch]) x.drawImage(TEX[KEY[ch]], i * 16, j * 16); });
    each((ch, i, j) => {
      x.fillStyle = 'rgba(255,255,255,0.10)'; x.fillRect(i * 16, j * 16, 16, 1); x.fillRect(i * 16, j * 16, 1, 16);
      x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(i * 16, j * 16 + 15, 16, 1); x.fillRect(i * 16 + 15, j * 16, 1, 16);
    });
    return c;
  }
  function drawX(x, T, now) {
    const cx = T.x * 16 + 8, cy = T.y * 16 + 8, p = (now % 1400) / 1400;
    x.strokeStyle = 'rgba(255,50,30,' + ((1 - p) * 0.9).toFixed(3) + ')';
    x.lineWidth = 2;
    x.beginPath(); x.arc(cx, cy, 7 + p * 20, 0, Math.PI * 2); x.stroke();
    const s = p < 0.5 ? 8 : 7;
    [['#3a0703', 4], ['#e0261b', 2]].forEach(([col, w]) => {
      x.fillStyle = col;
      for (let k = -s; k <= s; k++) {
        x.fillRect(cx + k - w / 2, cy + k - w / 2, w, w);
        x.fillRect(cx + k - w / 2, cy - k - w / 2, w, w);
      }
    });
  }
  function drawPlayer(x, P) {
    const cx = P.x * 16 + 8, cy = P.y * 16 + 8;
    const tri = (a, b, c, d, e, f) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.lineTo(e, f); x.closePath(); x.fill(); };
    x.fillStyle = '#000'; tri(cx, cy - 10, cx + 8, cy + 8, cx - 8, cy + 8);
    x.fillStyle = '#fff'; tri(cx, cy - 6, cx + 5, cy + 6, cx - 5, cy + 6);
  }
  function MapView(cv, opts) {
    const src = buildMap();
    cv.width = src.width; cv.height = src.height;
    const x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;
    for (let j = 0; j < MAP_H; j++) for (let i = 0; i < MAP_W; i++) x.drawImage(TEX.parchment, i * 16, j * 16);
    const order = [];
    for (let j = 0; j < MAP_H; j++) for (let i = 0; i < MAP_W; i++) order.push({ i, j, d: Math.hypot(i - PLAYER.x, j - PLAYER.y) + Math.random() * 2.5 });
    order.sort((a, b) => a.d - b.d);
    const dur = opts.duration || 2600, t0 = performance.now();
    let shown = 0, stopped = false;
    function reveal(now) {
      if (stopped) return;
      const target = Math.floor(Math.min(1, (now - t0) / dur) * order.length);
      const before = shown;
      while (shown < target) { const o = order[shown++]; x.drawImage(src, o.i * 16, o.j * 16, 16, 16, o.i * 16, o.j * 16, 16, 16); }
      if (opts.onTick && shown - before > 0 && Math.random() < 0.35) opts.onTick();
      if (shown < order.length) requestAnimationFrame(reveal);
      else { if (opts.onRevealed) opts.onRevealed(); requestAnimationFrame(loop); }
    }
    function loop(now) {
      if (stopped) return;
      x.drawImage(src, 0, 0);
      drawPlayer(x, PLAYER);
      drawX(x, opts.treasure, now);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(reveal);
    return { stop() { stopped = true; } };
  }

  window.GFX = {
    init() { makeTextures(); makeIcons(); },
    TEX, ICON, url, Panorama, MapView, MAP_W, MAP_H, PLAYER, LABELS
  };
})();
