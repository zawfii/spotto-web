// Pokaz w prawdziwym 3D: z ramki plakatu wysuwa się pusta szklanka (bryła szkła z logo B♥),
// wpadają kawałki banana i rośnie pulpa, potem strumień mleka, strumień matchy, czapa pianki
// i pył matchy. Szklanka obraca się dookoła, wraca w plakat, a na ramkę spada pieczątka 10/10.
// Jednostki MindAR: szerokość plakatu = 1, środek plakatu = (0,0), Y w górę, Z w stronę widza.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { canvasTex, etykietaTex, clamp, ease, faza, sprezyna } from '/bejbi/pokaz3d.js';

export const KONIEC = 10.8; // s — po tym czasie karta końcowa

// Plan (s): wysunięcie 0–0.9 · pulpa 0.9–2.5 · mleko 2.5–3.9 · matcha 3.9–5.3 · pianka 5.3–6.5
//           obrót 6.5–8.7 · powrót w plakat 8.7–9.5 · pieczątka 9.5–10.2
const ETAPY = [[0.9, 2.5], [2.5, 3.9], [3.9, 5.3], [5.3, 6.5]]; // od dołu: pulpa, mleko, matcha, pianka

const B_SCIEZKA = 'M343 222H686L795 253L876 345L900 453L876 546L835 600L810 612L835 624L885 693L913 808L885 925L826 998L722 1046H343Z M463 345H674L728 365L760 403L770 453L750 505L695 550H463Z M463 672H693L745 705L765 742L778 808L768 866L745 895L694 922H463Z';
const SERCE = 'M888 240L910 214L938 220L960 246L980 212L1018 208L1042 236L1033 277L962 357L912 310L888 262Z';

export async function zbudujPokaz(group, { plakat: P, ramka: R, szklanka: S, warstwy, maska, renderer, scene }) {
  const u = (px) => px / P.w;
  const X = (px) => px / P.w - 0.5;
  const Y = (py) => (P.h / 2 - py) / P.w;
  await Promise.all(['800 52px Barlow', '700 38px Manrope'].map((f) => document.fonts.load(f).catch(() => {})));
  const img = await new Promise((ok, zle) => { const i = new Image(); i.onload = () => ok(i); i.onerror = zle; i.src = S.src; });

  // Światło + odbicia (szkło wygląda jak szkło dzięki mapie otoczenia).
  if (!scene.userData.oswietlona) {
    scene.userData.oswietlona = true;
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;
    const slonce = new THREE.DirectionalLight(0xffffff, 2.2);
    slonce.position.set(-1, 2, 2);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xfff1a8, 1.1), slonce);
  }

  // ── Wymiary szklanki (jak na zdjęciu: lekko zwężona ku dołowi) ──
  const RT = u(S.w) * 0.48, RB = RT * 0.86, H = u(S.h) * 0.95, DNO = 0.022;
  const promien = (y) => (RB + (RT - RB) * (y / H)) * 0.955; // wnętrze na wysokości y

  // ── Plakat: zasłona na wydrukowaną szklankę, cień, pieczątka ──
  const zaslona = plaszcz(u(R.w), u(R.h), new THREE.MeshBasicMaterial({ color: 0xffeb00, alphaMap: maska, transparent: true, opacity: 0, depthWrite: false }), 1);
  zaslona.position.set(X(R.x + R.w / 2), Y(R.y + R.h / 2), 0.0005);
  const cien = plaszcz(RT * 3, RT * 0.9, new THREE.MeshBasicMaterial({
    transparent: true, opacity: 0, depthWrite: false,
    map: canvasTex(256, 256, (g, w, h) => {
      const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      r.addColorStop(0, 'rgba(30,27,5,.5)'); r.addColorStop(1, 'rgba(30,27,5,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, h);
    }),
  }), 2);
  const podstawa = { x: X(S.x + S.w / 2), y: Y(S.y + S.h - 6) };
  cien.position.set(podstawa.x + 0.04, podstawa.y + 0.02, 0.0008);
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

  // ── Szklanka ──
  const szkl = new THREE.Group();          // wysuwa się z plakatu, pochyla
  szkl.position.set(podstawa.x, podstawa.y, 0);
  const obrot = new THREE.Group();         // kręci się wokół własnej osi
  szkl.add(obrot);
  group.add(szkl);

  const profil = [[0, 0], [RB * 0.9, 0], [RB * 0.985, 0.006], [RB, 0.022], [RT, H], [RT * 0.985, H + 0.004]].map(([x, y]) => new THREE.Vector2(x, y));
  const szklo = (side, order) => {
    const m = new THREE.Mesh(new THREE.LatheGeometry(profil, 64), new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03,
      envMapIntensity: 1.6, transparent: true, opacity: side === THREE.BackSide ? 0.1 : 0.2, side, depthWrite: false,
    }));
    m.renderOrder = order;
    return m;
  };
  const dno = new THREE.Mesh(new THREE.CylinderGeometry(RB * 0.97, RB * 0.9, DNO, 48).translate(0, DNO / 2, 0),
    new THREE.MeshPhysicalMaterial({ color: 0xf4f4ee, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.45, depthWrite: false }));
  dno.renderOrder = 11;
  // Logo B♥ na ściance (żółte, jak na zdjęciu), wygięte razem ze szkłem.
  const logoTex = canvasTex(512, 512, (g) => {
    g.translate(256, 256); g.scale(0.5, 0.5); g.translate(-692, -628);
    g.fillStyle = '#F7C600';
    g.fill(new Path2D(B_SCIEZKA), 'evenodd');
    g.fill(new Path2D(SERCE));
  });
  const LOGO_H = H * 0.42, LOGO_Y = H * 0.42;
  const logo = new THREE.Mesh(
    new THREE.CylinderGeometry(promien(LOGO_Y + LOGO_H / 2) / 0.955 + 0.002, promien(LOGO_Y - LOGO_H / 2) / 0.955 + 0.002, LOGO_H, 32, 1, true, -0.62, 1.24),
    new THREE.MeshStandardMaterial({ map: logoTex, transparent: true, roughness: 0.35, depthWrite: false, side: THREE.FrontSide }));
  logo.position.y = LOGO_Y;
  logo.renderOrder = 13;
  obrot.add(szklo(THREE.BackSide, 10), dno, szklo(THREE.FrontSide, 12), logo);

  // ── Warstwy płynów (od dołu): pulpa, mleko, matcha, pianka; wysokości z proporcji na zdjęciu ──
  const wiersze = [...warstwy].reverse().map(([a, b]) => b - a);
  const suma = wiersze.reduce((x, y) => x + y, 0);
  const pojemnosc = (H - DNO) * 0.93;
  const wycinek = (sx, sy, sw, sh, w = 512, h = 256) => {
    const t = canvasTex(w, h, (g) => g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h));
    t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1);
    return t;
  };
  const kropki = (tlo, kolor, ile) => canvasTex(256, 256, (g) => {
    g.fillStyle = tlo; g.fillRect(0, 0, 256, 256);
    g.fillStyle = kolor;
    for (let i = 0; i < ile; i++) { g.globalAlpha = 0.25 + Math.random() * 0.6; g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 3, 0, 7); g.fill(); }
  });
  const materialy = [
    new THREE.MeshStandardMaterial({ map: wycinek(110, 480, 440, 260), roughness: 0.55 }),            // pulpa ze zdjęcia
    new THREE.MeshStandardMaterial({ color: 0xf6f1e4, roughness: 0.3 }),                                // mleko
    new THREE.MeshStandardMaterial({ color: 0x86ad3e, roughness: 0.35 }),                               // matcha
    new THREE.MeshStandardMaterial({ map: kropki('#f3e8c8', '#ffffff', 300), roughness: 0.8 }),         // pianka
  ];
  let y = DNO;
  const plyny = wiersze.map((wiersz, i) => {
    const h = (pojemnosc * wiersz) / suma;
    const geo = new THREE.CylinderGeometry(promien(y + h), promien(y), h, 48).translate(0, h / 2, 0);
    const m = new THREE.Mesh(geo, materialy[i]);
    m.position.y = y;
    m.userData = { y, h };
    m.scale.y = 0.001;
    m.visible = false;
    obrot.add(m);
    y += h;
    return m;
  });
  const gora = y; // poziom piany
  // Czapa pianki + pył matchy na wierzchu.
  const czapa = new THREE.Mesh(new THREE.SphereGeometry(promien(gora), 40, 14, 0, Math.PI * 2, 0, Math.PI / 2), materialy[3]);
  czapa.position.y = gora;
  czapa.scale.set(1, 0.001, 1);
  const pylTex = canvasTex(256, 256, (g) => {
    g.fillStyle = '#6f9a2c';
    for (let i = 0; i < 900; i++) { const r = Math.sqrt(Math.random()) * 120, a = Math.random() * 7; g.globalAlpha = 0.3 + Math.random() * 0.6; g.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 2.2, 2.2); }
  });
  const pylNaPianie = new THREE.Mesh(new THREE.SphereGeometry(promien(gora) * 1.004, 40, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: pylTex, transparent: true, opacity: 0, roughness: 0.9, depthWrite: false }));
  pylNaPianie.position.y = gora;
  pylNaPianie.renderOrder = 9;
  obrot.add(czapa, pylNaPianie);

  // Strumienie (mleko, matcha) z góry, spoza kadru.
  const strumien = (kolor) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, 1, 14).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: kolor, roughness: 0.25 }));
    m.visible = false;
    szkl.add(m);
    return m;
  };
  const strumienie = [null, strumien(0xf6f1e4), strumien(0x86ad3e), null];
  // Kawałki banana (kostki z teksturą pulpy) wpadające do szklanki.
  const kostkaMat = new THREE.MeshStandardMaterial({ map: wycinek(200, 560, 80, 80, 64, 64), roughness: 0.5 });
  const kostki = Array.from({ length: 12 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.026, 0.03), kostkaMat);
    m.userData = { start: ETAPY[0][0] + i * 0.09, x: (Math.random() - 0.5) * RB, z: (Math.random() - 0.5) * RB, obr: Math.random() * 6 };
    m.visible = false;
    obrot.add(m);
    return m;
  });
  // Pył matchy sypiący się na piankę.
  const N = 90, pos = new Float32Array(N * 3), dane = [];
  for (let i = 0; i < N; i++) dane.push({ x: (Math.random() - 0.5) * RT * 1.4, z: (Math.random() - 0.5) * RT * 1.4, opoz: Math.random() * 0.5 });
  const pylGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pyl = new THREE.Points(pylGeo, new THREE.PointsMaterial({ color: 0x6f9a2c, size: 0.007, transparent: true, opacity: 0, depthWrite: false }));
  obrot.add(pyl);

  // Naklejki z nazwami warstw (01–04 jak na plakacie), po lewej, nie obracają się ze szklanką.
  const naklejki = plyny.map((p, i) => {
    const [, , nr, nazwa] = warstwy[warstwy.length - 1 - i];
    const e = plaszcz(0.34, 0.34 * 132 / 760, new THREE.MeshBasicMaterial({ map: etykietaTex(nr, nazwa.toUpperCase()), transparent: true, opacity: 0, depthWrite: false }), 30);
    e.position.set(-RT - 0.08, p.userData.y + p.userData.h / 2, 0); // w płaszczyźnie osi szklanki: perspektywa nie wypycha poza plakat
    szkl.add(e);
    return e;
  });

  // Materiały, które zanikają przy powrocie szklanki w plakat.
  const doZaniku = [];
  obrot.traverse((o) => { if (o.material) doZaniku.push([o.material, o.material.opacity]); });
  let zanikaPrzygotowany = false;

  return function klatka(t) {
    const lot = faza(t, 0, 0.9) * (1 - faza(t, 8.7, 9.5));
    zaslona.material.opacity = Math.min(1, faza(t, 0, 0.35) * 1) * (1 - faza(t, 9.1, 9.5));
    cien.material.opacity = lot * 0.9;
    szkl.position.z = (RT + 0.08) * lot;
    szkl.scale.setScalar(0.85 + 0.15 * lot);
    szkl.rotation.x = 0.32 * lot;                       // pochylenie: widać wnętrze i wlewanie
    obrot.rotation.y = 0.25 * Math.sin(t * 0.9) * (1 - faza(t, 6.3, 6.6)) + Math.PI * 2 * faza(t, 6.5, 8.7);

    // płyny
    plyny.forEach((p, i) => {
      const f = faza(t, ETAPY[i][0] + (i === 0 ? 0.35 : 0.1), ETAPY[i][1]);
      p.visible = f > 0.001;
      p.scale.y = Math.max(0.001, f);
      const s = strumienie[i];
      if (s) {
        const aktywny = t > ETAPY[i][0] && t < ETAPY[i][1] - 0.15;
        s.visible = aktywny;
        if (aktywny) {
          const poziom = p.userData.y + p.userData.h * f;
          s.position.set(0.012 * Math.sin(t * 9), poziom, 0);
          s.scale.set(1 + 0.15 * Math.sin(t * 23), H + 0.26 - poziom, 1);
        }
      }
      naklejki[i].material.opacity = faza(t, ETAPY[i][0], ETAPY[i][0] + 0.35) * (1 - faza(t, 6.3, 6.8));
    });
    // kawałki banana: spadają i znikają w rosnącej pulpie
    kostki.forEach((k) => {
      const d = k.userData, tt = t - d.start;
      k.visible = tt > 0 && tt < 0.9;
      if (!k.visible) return;
      const dno = DNO + plyny[0].userData.h * plyny[0].scale.y;
      k.position.set(d.x, Math.max(dno, H + 0.35 - 2.4 * tt * tt), d.z);
      k.rotation.set(d.obr + tt * 5, d.obr * 2 + tt * 3, 0);
    });
    // pianka: czapa wyrasta ze sprężynką, potem pył
    const pi = clamp((t - ETAPY[3][0] - 0.4) / 0.7);
    czapa.scale.y = Math.max(0.001, 0.32 * sprezyna(pi));
    pylNaPianie.scale.y = czapa.scale.y * 1.01;
    czapa.visible = pi > 0;
    const sypanie = t - (ETAPY[3][1] - 0.2);
    pyl.material.opacity = sypanie > 0 && sypanie < 1.1 ? 0.9 : 0;
    if (pyl.material.opacity) {
      dane.forEach((d, i) => { const tt = Math.max(0, sypanie - d.opoz); pos.set([d.x, Math.max(gora + 0.03, gora + 0.3 - 0.9 * tt), d.z], i * 3); });
      pylGeo.attributes.position.needsUpdate = true;
    }
    pylNaPianie.material.opacity = faza(t, ETAPY[3][1], ETAPY[3][1] + 0.9) * 0.9;

    // powrót w plakat: szklanka gaśnie, spod zasłony wraca zdjęcie z druku
    const zanik = faza(t, 8.9, 9.4);
    if (zanik > 0 && !zanikaPrzygotowany) { zanikaPrzygotowany = true; doZaniku.forEach(([m]) => { m.transparent = true; m.needsUpdate = true; }); }
    if (zanikaPrzygotowany) doZaniku.forEach(([m, o]) => { m.opacity = o * (1 - zanik); });
    szkl.visible = zanik < 1;
    if (t < 0.05 && zanikaPrzygotowany) { zanikaPrzygotowany = false; doZaniku.forEach(([m, o]) => { m.opacity = o; }); } // „obejrzyj jeszcze raz”

    // pieczątka 10/10
    const o = clamp((t - 9.5) / 0.7);
    odznaka.material.opacity = Math.min(1, o * 3);
    odznaka.position.z = 0.003 + 0.4 * Math.pow(1 - o, 2);
    odznaka.scale.setScalar(t < 9.5 ? 0.001 : 0.6 + 0.4 * sprezyna(o));
    odznaka.rotation.z = -0.15 - 0.8 * (1 - sprezyna(o));
  };
}

function plaszcz(w, h, m, kolejnosc) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.renderOrder = kolejnosc;
  return mesh;
}
