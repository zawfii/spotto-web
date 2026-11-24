import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

// ── KONFIGURACJA ────────────────────────────────────────────────────────────
const CONFIG = {
  // „Oceń w Spoot” (link do bety / sklepu). Android nie ma jeszcze apki w sklepie → strona Spoot.
  ocenUrl: 'https://apps.apple.com/pl/app/id6822473524',
  ocenUrlAndroid: 'https://www.spootme.pl',
  // „Menu Bejbi w Spoot” → karta menu lokalu (pasek „Otwórz” otwiera apkę na zakładce Menu).
  menuUrl: 'https://spootme.pl/place/391d11f1-5945-4c70-a0c2-9ea26452f610/menu',
  posthogKey: 'phc_C7CCDonoDEAq9vJF4ZXQj3HViTxUZbtfnj348Dc4Rj4C',
  posthogHost: 'https://eu.i.posthog.com',
  // Ramka 9:16 na plakacie (px w poster-target.png 1123×1587): tu leży film.
  plakat: { w: 1123, h: 1587 },
  ramka: { x: 298, y: 384, w: 528, h: 939, r: 28 },
};

// ── ANALITYKA (PostHog, bez ciasteczek: id tylko w pamięci, bez profili osób) ──
const src = (new URLSearchParams(location.search).get('src') || 'brak').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'brak';
const distinctId = crypto.randomUUID?.() ?? String(Math.random()).slice(2);
const lokalnie = /^(localhost|127\.|192\.168\.|10\.)/.test(location.hostname) && !location.search.includes('ph=1');
const t0 = performance.now();
export const zdarzenia = []; // podgląd dla testów
function track(event, props = {}) {
  const properties = { src, ...props, ms: Math.round(performance.now() - t0), $current_url: location.href, $referrer: document.referrer || '$direct', $process_person_profile: false, $lib: 'bejbi-ar' };
  zdarzenia.push({ event, properties });
  if (lokalnie) return console.log('[track]', event, properties);
  fetch(`${CONFIG.posthogHost}/i/v0/e/`, {
    method: 'POST', keepalive: true, headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ api_key: CONFIG.posthogKey, event, distinct_id: distinctId, properties }),
  }).catch(() => {});
}
window.__zdarzenia = zdarzenia;

// ── ELEMENTY ────────────────────────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const film = $('#film');
const ekrany = { start: $('#start'), skan: $('#skan'), fallback: $('#fallback'), koniec: $('#koniec') };
const pokaz = (...nazwy) => Object.entries(ekrany).forEach(([n, el]) => { el.hidden = !nazwy.includes(n); });
const android = /android/i.test(navigator.userAgent);
$('#cta-ocen').href = android ? CONFIG.ocenUrlAndroid : CONFIG.ocenUrl;
$('#cta-menu').href = CONFIG.menuUrl;

let tryb = 'start'; // start | ar | fallback
let mindar = null;
let widoczny = false;
let znaleziono = false;
let skonczony = false;

track('scan_opened');

// ── AR ──────────────────────────────────────────────────────────────────────
function maskaZaokraglona({ w, h, r }) {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff'; g.beginPath();
  g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r); g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r);
  g.fill();
  return new THREE.CanvasTexture(c);
}

async function startAR() {
  const btn = $('#wlacz');
  btn.disabled = true; btn.textContent = 'Uruchamiam…';
  // iOS: odblokuj wideo w geście użytkownika, zanim MindAR przejmie wątek.
  film.play().then(() => { if (!widoczny) film.pause(); }).catch(() => {});

  const { plakat: P, ramka: R } = CONFIG;
  mindar = new MindARThree({
    container: $('#ar'), imageTargetSrc: '/bejbi/targets.mind', maxTrack: 1,
    uiLoading: 'no', uiScanning: 'no', uiError: 'no',
    filterMinCF: 0.0001, filterBeta: 0.001, // mniej drgań
  });
  const { renderer, scene, camera } = mindar;
  const tex = new THREE.VideoTexture(film);
  tex.colorSpace = THREE.SRGBColorSpace;
  // Jednostki MindAR: szerokość plakatu = 1, środek plakatu = (0,0), oś Y w górę.
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(R.w / P.w, R.h / P.w),
    new THREE.MeshBasicMaterial({ map: tex, alphaMap: maskaZaokraglona(R), transparent: true }),
  );
  plane.position.set((R.x + R.w / 2) / P.w - 0.5, (P.h / 2 - (R.y + R.h / 2)) / P.w, 0.001);
  const anchor = mindar.addAnchor(0);
  anchor.group.add(plane);
  anchor.onTargetFound = () => {
    widoczny = true;
    if (!znaleziono) { znaleziono = true; track('target_found'); }
    if (tryb === 'ar') { pokaz(skonczony ? 'koniec' : null); if (!skonczony) film.play().catch(() => {}); }
  };
  anchor.onTargetLost = () => {
    widoczny = false;
    film.pause();
    if (tryb === 'ar' && !skonczony) pokaz('skan');
  };

  try {
    await mindar.start();
  } catch (e) {
    console.error(e);
    return startFallback('blad_aparatu');
  }
  if (tryb !== 'start') return; // użytkownik w międzyczasie wybrał film
  tryb = 'ar';
  film.currentTime = 0;
  pokaz('skan');
  track('ar_started');
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
  setTimeout(() => { if (!znaleziono && tryb === 'ar') $('#podpowiedz').textContent = 'Podejdź bliżej, cały plakat w kadrze'; }, 8000);
}

function stopAR() {
  if (!mindar) return;
  mindar.renderer.setAnimationLoop(null);
  try { mindar.stop(); } catch {}
  $('#ar').replaceChildren();
  mindar = null;
}

// ── FILM BEZ AR ─────────────────────────────────────────────────────────────
function startFallback(powod) {
  track('fallback_used', { powod, z_ekranu: tryb });
  tryb = 'fallback';
  stopAR();
  skonczony = false;
  $('#fallback').append(film);
  film.controls = true;
  film.currentTime = 0;
  pokaz('fallback');
  film.play().catch(() => {});
}

// ── KONIEC FILMU ────────────────────────────────────────────────────────────
film.addEventListener('ended', () => {
  skonczony = true;
  track('video_completed', { tryb });
  pokaz(...(tryb === 'fallback' ? ['fallback', 'koniec'] : ['koniec']));
});

$('#jeszcze').addEventListener('click', () => {
  skonczony = false;
  film.currentTime = 0;
  if (tryb === 'fallback') { pokaz('fallback'); film.play(); }
  else { pokaz(widoczny ? null : 'skan'); if (widoczny) film.play(); }
});

document.querySelectorAll('[data-cta]').forEach((a) => a.addEventListener('click', () => track('cta_clicked', { cta: a.dataset.cta, tryb })));
document.querySelectorAll('[data-fallback]').forEach((b) => b.addEventListener('click', () => startFallback('przycisk')));
$('#wlacz').addEventListener('click', startAR, { once: true });
Object.assign($('#wlacz'), { disabled: false, textContent: 'Włącz aparat' }); // biblioteki gotowe
$('#zamknij').addEventListener('click', () => { film.pause(); location.reload(); });
