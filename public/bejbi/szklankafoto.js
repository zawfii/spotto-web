// Pokaz „1:1”: zdjęcie szklanki nałożone na bryłę 3D o jej kształcie (kontur z kanału alfa zdjęcia).
// Wydruk „nadmuchuje się” w bryłę i wychodzi przed plakat, szklanka się opróżnia, potem składniki
// wlewają się po kolei i odsłaniają warstwy z prawdziwego zdjęcia. Pełna szklanka = zdjęcie z plakatu,
// więc na koniec spłaszcza się z powrotem w wydruk bez skoku. Potem pieczątka 10/10.
// Zdjęcie pokazuje tylko przód: kołysanie do ~22°, bez pełnego obrotu (boki by się rozmazały).
// Jednostki MindAR: szerokość plakatu = 1, środek plakatu = (0,0), Y w górę, Z w stronę widza.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { canvasTex, clamp, faza, sprezyna } from '/bejbi/pokaz3d.js';

export const KONIEC = 10.9; // s — po tym czasie karta końcowa

// Wiersze zdjęcia (664×789), w których zaczynają się warstwy; DNO = góra szklanego dna.
const W_MATCHA = 185, W_MLEKO = 320, W_PULPA = 455, W_DNO = 762;
// Plan (s)
const T = { wyjscie: 0.9, pusta: 1.6, pulpa: [1.9, 3.3], mleko: [3.4, 4.7], matcha: [4.8, 6.1], pianka: [6.3, 7.2], powrot: [8.8, 9.6], pieczatka: 9.6 };
const KROK = 3, N = 96;
const lerp = (a, b, f) => a + (b - a) * f;

export async function zbudujPokaz(group, { plakat: P, ramka: R, szklanka: S, warstwy, maska, renderer, scene }) {
  const X = (px) => px / P.w - 0.5;
  const Y = (py) => (P.h / 2 - py) / P.w;
  const u = (px) => px / P.w;
  await Promise.all(['800 52px Barlow', '700 38px Manrope'].map((f) => document.fonts.load(f).catch(() => {})));
  const img = await new Promise((ok, zle) => { const i = new Image(); i.onload = () => ok(i); i.onerror = zle; i.src = S.src; });
  const W = img.naturalWidth, H = img.naturalHeight;
  const k = S.w / W / P.w; // jednostki MindAR na piksel zdjęcia

  // ── Kontur szklanki z kanału alfa ──
  const cv = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = ctx.getImageData(0, 0, W, H).data;
  const lewa = [], prawa = [];
  for (let j = 0; j < H; j++) {
    let l = -1, r = -1;
    for (let x = 0; x < W; x++) if (px[(j * W + x) * 4 + 3] > 127) { if (l < 0) l = x; r = x; }
    lewa.push(l); prawa.push(r);
  }
  const j0 = lewa.findIndex((v) => v >= 0), j1 = H - 1 - [...lewa].reverse().findIndex((v) => v >= 0);
  const srodki = []; for (let j = j0 + 60; j < j1 - 60; j++) srodki.push((lewa[j] + prawa[j]) / 2);
  const cx = srodki.sort((a, b) => a - b)[srodki.length >> 1];
  const rSurowe = lewa.map((l, j) => (l < 0 ? 0 : (prawa[j] - l) / 2));
  const r = (j) => { let s = 0, n = 0; for (let d = -4; d <= 4; d++) { const jj = Math.min(j1, Math.max(j0, Math.round(j) + d)); s += rSurowe[jj]; n++; } return Math.max(0.5, s / n); };
  const rMax = Math.max(...rSurowe);
  const kolor = (j, ile) => { const i = (j * W + Math.round(cx - r(j) * ile)) * 4; return new THREE.Color().setRGB(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255, THREE.SRGBColorSpace); };

  // ── Siatka: pierścienie od dna (a=0) do góry; u zależy tylko od x (rzut zdjęcia od frontu) ──
  const rzedy = []; for (let j = j1; j > j0; j -= KROK) rzedy.push(j); rzedy.push(j0);
  const pos = [], uv = [], idx = [];
  rzedy.forEach((j) => {
    const rr = r(j);
    for (let i = 0; i <= N; i++) {
      const th = (i / N) * Math.PI * 2, x = rr * Math.sin(th);
      pos.push(x, j1 - j, rr * Math.cos(th));
      uv.push((cx + x + 0.5) / W, 1 - (j + 0.5) / H);
    }
  });
  const PASY = rzedy.length - 1;
  for (let a = 0; a < PASY; a++) for (let i = 0; i < N; i++) {
    const i0 = a * (N + 1) + i, i1 = i0 + 1, i2 = i0 + N + 1, i3 = i2 + 1;
    idx.push(i0, i1, i3, i0, i3, i2);
  }
  const srodekGory = pos.length / 3;
  pos.push(0, j1 - j0, 0); uv.push(cx / W, 1 - (j0 + 34) / H); // wieczko: od rantu do koloru pianki
  for (let i = 0; i < N; i++) idx.push(srodekGory, PASY * (N + 1) + i, PASY * (N + 1) + i + 1);
  const atrPos = new THREE.Float32BufferAttribute(pos, 3), atrUv = new THREE.Float32BufferAttribute(uv, 2);
  const geo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', atrPos); g.setAttribute('uv', atrUv); g.setIndex(idx); return g; };
  const pasDla = (wiersz) => Math.round(clamp((j1 - wiersz) / (j1 - j0)) * PASY);
  const CALOSC = idx.length;

  // ── Światło i odbicia dla szklanej powłoki ──
  if (!scene.userData.oswietlona) {
    scene.userData.oswietlona = true;
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;
  }

  // ── Plakat: zasłona na wydruk, cień, pieczątka ──
  const plaszcz = (w, h, m, kolejnosc) => Object.assign(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), { renderOrder: kolejnosc });
  const zaslona = plaszcz(u(R.w), u(R.h), new THREE.MeshBasicMaterial({ color: 0xffeb00, alphaMap: maska, transparent: true, opacity: 0, depthWrite: false }), 1);
  zaslona.position.set(X(R.x + R.w / 2), Y(R.y + R.h / 2), 0.0005);
  const os = { x: X(S.x + (cx + 0.5) * S.w / W), y: Y(S.y + (j1 + 0.5) * S.w / W) }; // oś i spód szklanki na plakacie
  const cien = plaszcz(rMax * k * 3, rMax * k * 0.9, new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false,
    map: canvasTex(256, 256, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(30,27,5,.5)'); gr.addColorStop(1, 'rgba(30,27,5,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }),
  }), 2);
  cien.position.set(os.x + 0.04, os.y + 0.02, 0.0008);
  const odznaka = plaszcz(u(220), u(220), new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false,
    map: canvasTex(512, 512, (g) => {
      g.fillStyle = '#164938'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
      g.font = '800 200px Barlow';
      const a = g.measureText('10').width, b = g.measureText('/10').width, x0 = 256 - (a + b) / 2;
      g.fillStyle = '#ff751f'; g.fillText('10', x0, 300);
      g.fillStyle = '#fdf5ec'; g.fillText('/10', x0 + a, 300);
      g.font = '700 38px Manrope'; g.textAlign = 'center'; g.fillText('OCENA SPOOT', 256, 372);
    }),
  }), 40);
  odznaka.position.set(X(R.x + R.w - 125), Y(R.y + 120), 0.003);
  group.add(zaslona, cien, odznaka);

  // ── Szklanka (wnętrze grup w pikselach zdjęcia; y = 0 na spodzie szklanki) ──
  const szkl = new THREE.Group();
  szkl.position.set(os.x, os.y, 0.002);
  const obrot = new THREE.Group();
  szkl.add(obrot);
  group.add(szkl);

  const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  const gFoto = geo();
  const foto = new THREE.Mesh(gFoto, new THREE.MeshBasicMaterial({ map: tex }));   // bez cieniowania: kolory jak na zdjęciu
  // Mleko: biała warstwa, która przy wlewaniu matchy „miesza się” w zieleń ze zdjęcia.
  const gMleko = geo();
  const mleko = new THREE.Mesh(gMleko, new THREE.MeshBasicMaterial({ color: 0xf5f0e0, transparent: true, depthWrite: false }));
  mleko.scale.set(1.002, 1, 1.002); mleko.renderOrder = 5;
  // Logo B♥ wycięte ze zdjęcia kluczem koloru — widać je też na pustej szklance.
  // ponytail: prostokąty czyszczące są dobrane do tego jednego zdjęcia; przy nowym zdjęciu dobrać od nowa.
  const logoTex = canvasTex(W, H, (g) => {
    const d = g.createImageData(W, H);
    for (let y = 228; y < 620; y++) for (let x = 180; x < 540; x++) {
      if ((x > 470 && y > 312) || (x > 262 && x < 400 && y > 462 && y < 545)) continue; // pulpa obok litery i w jej otworze
      const i = (y * W + x) * 4, dist = Math.hypot(px[i] - 253, px[i + 1] - 197, px[i + 2]);
      d.data.set([253, 197, 0, 255 * clamp((26 - dist) / 14)], i);
    }
    g.putImageData(d, 0, 0);
  });
  const gLogo = geo(); gLogo.setDrawRange(pasDla(625) * N * 6, (pasDla(225) - pasDla(625)) * N * 6);
  const logo = new THREE.Mesh(gLogo, new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, depthWrite: false }));
  logo.scale.set(1.004, 1, 1.004); logo.renderOrder = 14;
  // Szklana powłoka (widoczna, gdy szklanka nie jest pełna; pełną pokazuje samo zdjęcie).
  const profil = rzedy.map((j) => new THREE.Vector2(r(j) * 1.012, j1 - j));
  const powloka = (side, order, op) => {
    const m = new THREE.Mesh(new THREE.LatheGeometry(profil, 64), new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.5, transparent: true, opacity: op, side, depthWrite: false,
    }));
    m.renderOrder = order; m.userData.op = op;
    return m;
  };
  const szkloTyl = powloka(THREE.BackSide, 4, 0.12), szkloPrzod = powloka(THREE.FrontSide, 12, 0.22);
  // Lustro płynu na aktualnym poziomie.
  const lustro = new THREE.Mesh(new THREE.CircleGeometry(1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const K = { pulpa: kolor(660, 0.3), mleko: new THREE.Color(0xf5f0e0), matcha: new THREE.Color(0x8fae4a), pianka: kolor(130, 0.3) }; // próbki ze środka, poza logo; matcha żywsza niż na zdjęciu, żeby strumień był czytelny
  obrot.add(szkloTyl, foto, mleko, lustro, szkloPrzod, logo);

  // Strumienie (mleko, matcha) i kawałki banana wpadające przy pulpie.
  const strumien = (c) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(9, 12, 1, 14).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: c }));
    m.visible = false; szkl.add(m);
    return m;
  };
  const strMleko = strumien(K.mleko), strMatcha = strumien(K.matcha);
  const kostkaTex = canvasTex(64, 64, (g) => g.drawImage(img, 250, 600, 90, 90, 0, 0, 64, 64));
  const kostki = Array.from({ length: 12 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(46, 38, 42), new THREE.MeshBasicMaterial({ map: kostkaTex }));
    m.userData = { start: T.pulpa[0] - 0.2 + i * 0.09, x: (Math.random() - 0.5) * rMax, z: (Math.random() - 0.5) * rMax, obr: Math.random() * 6 };
    m.visible = false; obrot.add(m);
    return m;
  });
  // Pył matchy sypany na piankę.
  const NP = 90, pp = new Float32Array(NP * 3), dane = [];
  for (let i = 0; i < NP; i++) dane.push({ x: (Math.random() - 0.5) * rMax * 1.5, z: (Math.random() - 0.5) * rMax * 1.5, opoz: Math.random() * 0.5 });
  const pylGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const pyl = new THREE.Points(pylGeo, new THREE.PointsMaterial({ color: 0x6f9a2c, size: 0.007, transparent: true, opacity: 0, depthWrite: false }));
  obrot.add(pyl);
  // Aktualnie wlewany składnik (01–04 jak na plakacie) — app.js pokazuje go dużym napisem na ekranie,
  // bo naklejka w 3D maleje razem z plakatem i z daleka jest nieczytelna.
  const etapy = [T.pulpa[0], T.mleko[0], T.matcha[0], T.pianka[0]].map((od, i) => {
    const [, , nr, nazwa] = warstwy[warstwy.length - 1 - i];
    return { od, nr, nazwa };
  });

  const GORA = j1 - j0;
  // Poziom płynu (wiersz zdjęcia) w czasie t; null = pełna szklanka (samo zdjęcie).
  const poziom = (t) => {
    if (t < T.wyjscie || t >= T.pianka[1]) return null;
    if (t < T.pulpa[0]) return lerp(j0, W_DNO, faza(t, T.wyjscie, T.pusta));
    if (t < T.mleko[0]) return lerp(W_DNO, W_PULPA, faza(t, ...T.pulpa));
    if (t < T.matcha[0]) return lerp(W_PULPA, W_MLEKO, faza(t, ...T.mleko));
    if (t < T.pianka[0]) return lerp(W_MLEKO, W_MATCHA, faza(t, ...T.matcha));
    return lerp(W_MATCHA, j0, faza(t, ...T.pianka));
  };

  return function klatka(t) {
    const lot = faza(t, 0, T.wyjscie) * (1 - faza(t, ...T.powrot));
    zaslona.material.opacity = t > 0.01 ? 1 : 0;
    cien.material.opacity = lot * 0.9;
    // spłaszczona (jak wydruk) → pełna bryła przed plakatem
    szkl.scale.set(k, k, k * (0.02 + 0.98 * lot));
    szkl.position.z = 0.002 + (rMax * k + 0.06) * lot;
    obrot.rotation.y = 0.38 * Math.sin((t - 0.4) * 1.5) * lot; // kołysanie do ~22°

    const L = poziom(t), pelna = L === null;
    gFoto.setDrawRange(0, pelna ? CALOSC : pasDla(L) * N * 6);
    const niepelna = faza(t, T.wyjscie, T.wyjscie + 0.25) * (1 - faza(t, T.pianka[1], T.pianka[1] + 0.4));
    szkloTyl.material.opacity = szkloTyl.userData.op * niepelna;
    szkloPrzod.material.opacity = szkloPrzod.userData.op * niepelna;
    szkloTyl.visible = szkloPrzod.visible = logo.visible = niepelna > 0.001;

    // mleko: biały pas od pulpy do poziomu; znika, gdy wlewa się matcha
    const jestMleko = !pelna && t >= T.mleko[0] && t < T.matcha[1];
    mleko.visible = jestMleko;
    if (jestMleko) {
      const od = pasDla(W_PULPA);
      gMleko.setDrawRange(od * N * 6, Math.max(0, pasDla(L) - od) * N * 6);
      mleko.material.opacity = 1 - faza(t, T.matcha[0] + 0.1, T.matcha[1] - 0.1);
    }
    // lustro płynu
    lustro.visible = !pelna && L < W_DNO - 2;
    if (lustro.visible) {
      lustro.position.y = j1 - L;
      lustro.scale.setScalar(r(L) * 0.985);
      const c = lustro.material.color;
      if (t < T.pulpa[0]) c.copy(L < W_MATCHA ? K.pianka : L < W_PULPA ? K.matcha : K.pulpa);
      else if (t < T.mleko[0]) c.copy(K.pulpa);
      else if (t < T.matcha[0]) c.copy(K.mleko);
      else if (t < T.pianka[0]) c.copy(K.mleko).lerp(K.matcha, faza(t, T.matcha[0], T.matcha[0] + 0.6));
      else c.copy(K.pianka);
    }
    // strumienie
    [[strMleko, T.mleko], [strMatcha, T.matcha]].forEach(([s, [a, b]]) => {
      s.visible = t > a - 0.1 && t < b - 0.15 && !pelna;
      if (s.visible) { s.position.set(8 * Math.sin(t * 9), j1 - L, 0); s.scale.set(1 + 0.15 * Math.sin(t * 23), GORA + 330 - (j1 - L), 1); }
    });
    // kawałki banana
    kostki.forEach((m) => {
      const d = m.userData, tt = t - d.start;
      m.visible = tt > 0 && tt < 0.9 && !pelna;
      if (!m.visible) return;
      m.position.set(d.x * 0.8, Math.max(j1 - L, GORA + 420 - 2600 * tt * tt), d.z * 0.8);
      m.rotation.set(d.obr + tt * 5, d.obr * 2 + tt * 3, 0);
    });
    // pył matchy
    const syp = t - (T.pianka[1] - 0.5);
    pyl.material.opacity = syp > 0 && syp < 1.2 ? 0.9 : 0;
    if (pyl.material.opacity) {
      dane.forEach((d, i) => { const tt = Math.max(0, syp - d.opoz); pp.set([d.x, Math.max(GORA + 6, GORA + 330 - 900 * tt), d.z], i * 3); });
      pylGeo.attributes.position.needsUpdate = true;
    }

    // pieczątka 10/10
    const o = clamp((t - T.pieczatka) / 0.7);
    odznaka.material.opacity = Math.min(1, o * 3);
    odznaka.position.z = 0.003 + 0.4 * Math.pow(1 - o, 2);
    odznaka.scale.setScalar(t < T.pieczatka ? 0.001 : 0.6 + 0.4 * sprezyna(o));
    odznaka.rotation.z = -0.15 - 0.8 * (1 - sprezyna(o));
    return t < T.pianka[1] + 0.6 ? etapy.findLast((e) => t >= e.od - 0.15) ?? null : null;
  };
}
