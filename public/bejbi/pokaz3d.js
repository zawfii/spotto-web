// Pokaz 3D na plakacie: szklanka odrywa się od ramki, wylatuje przed plakat, rozkłada na 4 warstwy
// z podpisami, wokół krążą kawałki banana i pył matchy, potem wszystko wraca na miejsce
// i na ramkę spada pieczątka 10/10 Spoot. Wszystko z jednego zdjęcia (szklanka.png), bez filmu.
// Jednostki MindAR: szerokość plakatu = 1, środek plakatu = (0,0), Y w górę, Z w stronę widza.
import * as THREE from 'three';

export const KONIEC = 9.6; // s — po tym czasie karta końcowa

const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { v = clamp(v); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; };
const faza = (t, a, b) => ease((t - a) / (b - a));
const sprezyna = (v) => { v = clamp(v); const c = 1.9; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); };

function canvasTex(w, h, rysuj) {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  rysuj(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const mat = (o) => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, ...o });
const plaszczyzna = (w, h, m, kolejnosc = 10) => Object.assign(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), { renderOrder: kolejnosc });

function etykietaTex(nr, nazwa) {
  return canvasTex(760, 132, (g, w, h) => {
    g.font = '800 52px Barlow';
    let rozmiar = 52;
    while (g.measureText(nazwa).width > w - 190 && rozmiar > 30) g.font = `800 ${--rozmiar}px Barlow`;
    const szer = 150 + g.measureText(nazwa).width + 34;
    g.fillStyle = '#1E1B05';
    g.beginPath(); g.roundRect ? g.roundRect(0, 0, szer, h, h / 2) : g.rect(0, 0, szer, h); g.fill();
    g.fillStyle = '#FFEB00'; g.beginPath(); g.arc(66, h / 2, 50, 0, 7); g.fill();
    g.fillStyle = '#1E1B05'; g.textBaseline = 'middle';
    g.textAlign = 'center'; g.font = '800 44px Barlow'; g.fillText(nr, 66, h / 2 + 3);
    g.fillStyle = '#FFEB00'; g.textAlign = 'left'; g.font = `800 ${rozmiar}px Barlow`; g.fillText(nazwa, 134, h / 2 + 3);
  });
}

export async function zbudujPokaz(group, { plakat: P, ramka: R, szklanka: S, warstwy, maska }) {
  const u = (px) => px / P.w;
  const X = (px) => px / P.w - 0.5;
  const Y = (py) => (P.h / 2 - py) / P.w;
  await Promise.all(['800 52px Barlow', '700 38px Manrope'].map((f) => document.fonts.load(f).catch(() => {})));
  const img = await new Promise((ok, zle) => { const i = new Image(); i.onload = () => ok(i); i.onerror = zle; i.src = S.src; });
  const H = img.naturalHeight;

  // Żółta zasłona na ramce: chowa wydrukowaną szklankę, kiedy ta w 3D się odrywa.
  const zaslona = plaszczyzna(u(R.w), u(R.h), mat({ color: 0xffeb00, alphaMap: maska, opacity: 0 }), 1);
  zaslona.position.set(X(R.x + R.w / 2), Y(R.y + R.h / 2), 0.0005);
  // Cień pod lewitującą szklanką.
  const cien = plaszczyzna(u(S.w) * 1.15, u(S.w) * 0.4, mat({
    opacity: 0,
    map: canvasTex(256, 256, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, 'rgba(30,27,5,.55)'); r.addColorStop(1, 'rgba(30,27,5,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
    }),
  }), 2);
  cien.position.set(X(S.x + S.w / 2), Y(S.y + S.h) + 0.03, 0.0008);
  group.add(zaslona, cien);

  // Szklanka = 4 plastry z jednego zdjęcia (pianka, matcha, mleko, pulpa).
  const szkl = new THREE.Group();
  szkl.position.set(X(S.x + S.w / 2), Y(S.y + S.h / 2), 0);
  group.add(szkl);
  const baza = new THREE.Texture(img);
  baza.colorSpace = THREE.SRGBColorSpace;
  baza.needsUpdate = true;
  const plastry = warstwy.map(([gora, dol, nr, nazwa]) => {
    const t = baza.clone();
    t.needsUpdate = true;
    t.repeat.set(1, (dol - gora) / H);
    t.offset.set(0, 1 - dol / H);
    const m = plaszczyzna(u(S.w), u(S.h * (dol - gora) / H), mat({ map: t }));
    m.userData.y0 = u(S.h) / 2 - u(S.h * (gora + dol) / 2 / H);
    const e = plaszczyzna(0.3, 0.3 * 132 / 760, mat({ map: etykietaTex(nr, nazwa.toUpperCase()), opacity: 0 }), 20); // zawsze nad plastrami
    e.position.x = -0.2; // naklejka na lewej krawędzi plastra, w granicach plakatu
    m.userData.etykieta = e;
    szkl.add(m, e);
    return m;
  });

  // Kawałki banana wycięte z pulpy na zdjęciu.
  const wycinki = [[170, 560], [300, 610], [420, 555], [230, 680], [380, 690], [470, 630]].map(([sx, sy]) =>
    canvasTex(96, 96, (g) => { g.beginPath(); g.arc(48, 48, 46, 0, 7); g.clip(); g.drawImage(img, sx, sy, 64, 64, 0, 0, 96, 96); }));
  const kawalki = Array.from({ length: 14 }, (_, k) => {
    const m = plaszczyzna(0.045, 0.045, mat({ map: wycinki[k % wycinki.length], opacity: 0 }));
    m.userData = { th: (k / 14) * Math.PI * 2, r: 0.27 + 0.07 * Math.random(), y: (Math.random() - 0.5) * 0.45, v: 0.45 + Math.random() * 0.5, s: 0.7 + Math.random() * 0.7 };
    szkl.add(m);
    return m;
  });
  // Pył matchy.
  const N = 80;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const th = Math.random() * Math.PI * 2, r = 0.12 + Math.random() * 0.22;
    pos.set([Math.cos(th) * r, (Math.random() - 0.5) * 0.55, Math.sin(th) * r], i * 3);
  }
  const pyl = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3)),
    new THREE.PointsMaterial({ color: 0x7da23a, size: 0.011, transparent: true, opacity: 0, depthWrite: false }));
  szkl.add(pyl);

  // Pieczątka 10/10 Spoot na prawym górnym rogu ramki.
  const odznaka = plaszczyzna(u(220), u(220), mat({
    opacity: 0,
    map: canvasTex(512, 512, (g) => {
      g.fillStyle = '#164938'; g.beginPath(); g.arc(256, 256, 250, 0, 7); g.fill();
      g.font = '800 200px Barlow'; g.textBaseline = 'alphabetic';
      const a = g.measureText('10').width, b = g.measureText('/10').width, x0 = 256 - (a + b) / 2;
      g.fillStyle = '#ff751f'; g.fillText('10', x0, 300);
      g.fillStyle = '#fdf5ec'; g.fillText('/10', x0 + a, 300);
      g.font = '700 38px Manrope'; g.textAlign = 'center'; g.fillText('OCENA SPOOT', 256, 372);
    }),
  }), 40);
  odznaka.position.set(X(R.x + R.w - 125), Y(R.y + 120), 0.003); // puste żółte pole nad szklanką
  group.add(odznaka);

  return function klatka(t) {
    const lot = faza(t, 0.2, 1.2) * (1 - faza(t, 7.4, 8.4));   // oderwanie od plakatu
    const rozklad = faza(t, 1.4, 2.6) * (1 - faza(t, 6.4, 7.4));
    const roj = faza(t, 1.8, 2.8) * (1 - faza(t, 6.2, 7.2));
    zaslona.material.opacity = Math.min(1, lot * 6);
    cien.material.opacity = lot;
    cien.scale.setScalar(1 + lot * 0.35);
    cien.position.x = X(S.x + S.w / 2) + 0.05 * lot; // światło z lewej góry: cień ucieka w prawo-dół
    szkl.position.z = 0.3 * lot;
    szkl.scale.setScalar(1 + 0.22 * lot);
    szkl.rotation.set(0.25 * lot, 0.35 * Math.sin(t * 1.1) * lot, 0);
    plastry.forEach((m, i) => {
      m.position.y = m.userData.y0 + (1.5 - i) * 0.07 * rozklad + Math.sin(t * 2 + i) * 0.006 * rozklad;
      m.position.z = (i % 2 ? 0.05 : -0.03) * rozklad;
      m.rotation.y = (i % 2 ? 0.25 : -0.25) * rozklad;
      const e = m.userData.etykieta;
      e.position.set(e.position.x, m.position.y, m.position.z + 0.03);
      e.material.opacity = faza(t, 1.9 + i * 0.25, 2.3 + i * 0.25) * (1 - faza(t, 6.0, 6.5));
    });
    kawalki.forEach((m) => {
      const d = m.userData, th = d.th + t * d.v, r = d.r * (0.4 + 0.6 * roj);
      m.position.set(Math.cos(th) * r, d.y * roj + Math.sin(t * 1.5 + d.th) * 0.02, Math.sin(th) * r * 0.8 + 0.05);
      m.rotation.z = t * d.v * 2;
      m.scale.setScalar(Math.max(0.001, d.s * roj));
      m.material.opacity = roj;
    });
    pyl.rotation.y = t * 0.5;
    pyl.scale.setScalar(0.3 + 0.7 * roj);
    pyl.material.opacity = 0.9 * roj;
    const o = clamp((t - 8.3) / 0.7);
    odznaka.material.opacity = Math.min(1, o * 3);
    odznaka.position.z = 0.003 + 0.4 * Math.pow(1 - o, 2);
    odznaka.scale.setScalar(t < 8.3 ? 0.001 : 0.6 + 0.4 * sprezyna(o));
    odznaka.rotation.z = -0.15 - 0.8 * (1 - sprezyna(o));
  };
}
