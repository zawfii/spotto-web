import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';
// Pokaz: zdjęcie na bryle 3D (szklankafoto.js). Starsze wersje: ?wersja=3d (grafika 3D), ?wersja=plaski (pocięte zdjęcie).
const MODULY = { foto: '/bejbi/szklankafoto.js', '3d': '/bejbi/szklanka3d.js', plaski: '/bejbi/pokaz3d.js' };
const wersja = MODULY[new URLSearchParams(location.search).get('wersja')] ? new URLSearchParams(location.search).get('wersja') : 'foto';
const { zbudujPokaz, KONIEC } = await import(MODULY[wersja]);

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
  // Zdjęcie szklanki (664×789) i jego miejsce na plakacie (px).
  szklanka: { src: '/bejbi/szklanka.png', x: 332, y: 580, w: 460, h: 547 },
  // Warstwy w wierszach zdjęcia, od góry: [od, do, nr, nazwa] — jak skład na plakacie.
  warstwy: [[0, 185, '01', 'Pianka ze śmietanki'], [185, 320, '02', 'Matcha'], [320, 455, '03', 'Mleko'], [455, 789, '04', 'Pulpa bananowa']],
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
let tPokazu = 0; // s pokazu 3D; biegnie tylko, gdy plakat jest w kadrze

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

  mindar = new MindARThree({
    container: $('#ar'), imageTargetSrc: '/bejbi/targets.mind', maxTrack: 1,
    uiLoading: 'no', uiScanning: 'no', uiError: 'no',
    filterMinCF: 0.0001, filterBeta: 0.001, // mniej drgań
  });
  const { renderer, scene, camera } = mindar;
  const anchor = mindar.addAnchor(0);
  const pokazGotowy = zbudujPokaz(anchor.group, { ...CONFIG, maska: maskaZaokraglona(CONFIG.ramka), renderer, scene });
  anchor.onTargetFound = () => {
    widoczny = true;
    if (!znaleziono) { znaleziono = true; track('target_found'); }
    if (tryb === 'ar') pokaz(skonczony ? 'koniec' : null);
  };
  anchor.onTargetLost = () => {
    widoczny = false;
    if (tryb === 'ar' && !skonczony) pokaz('skan');
  };

  let klatka;
  try {
    [klatka] = await Promise.all([pokazGotowy, mindar.start()]);
  } catch (e) {
    console.error(e);
    return startFallback('blad_aparatu');
  }
  if (tryb !== 'start') return; // użytkownik w międzyczasie wybrał film
  tryb = 'ar';
  pokaz('skan');
  track('ar_started');
  let ostatnio = performance.now();
  renderer.setAnimationLoop(() => {
    const teraz = performance.now();
    if (widoczny && !skonczony) {
      tPokazu += Math.min(0.05, (teraz - ostatnio) / 1000);
      if (tPokazu >= KONIEC) {
        skonczony = true;
        track('video_completed', { tryb: 'ar', wersja });
        pokaz('koniec');
      }
    }
    ostatnio = teraz;
    klatka(Math.min(tPokazu, KONIEC));
    window.__pokazT = tPokazu;
    renderer.render(scene, camera);
  });
  setTimeout(() => { if (!znaleziono && tryb === 'ar') $('#podpowiedz').textContent = 'Cały plakat w kadrze, bez odblasków'; }, 8000);
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
  if (tryb !== 'fallback') return;
  skonczony = true;
  track('video_completed', { tryb });
  pokaz('fallback', 'koniec');
});

$('#jeszcze').addEventListener('click', () => {
  skonczony = false;
  if (tryb === 'fallback') { film.currentTime = 0; pokaz('fallback'); film.play(); }
  else { tPokazu = 0; pokaz(widoczny ? null : 'skan'); }
});

document.querySelectorAll('[data-cta]').forEach((a) => a.addEventListener('click', () => track('cta_clicked', { cta: a.dataset.cta, tryb })));
document.querySelectorAll('[data-fallback]').forEach((b) => b.addEventListener('click', () => startFallback('przycisk')));
$('#wlacz').addEventListener('click', startAR, { once: true });
Object.assign($('#wlacz'), { disabled: false, textContent: 'Włącz aparat' }); // biblioteki gotowe
$('#zamknij').addEventListener('click', () => { film.pause(); location.reload(); });
