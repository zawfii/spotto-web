// Statystyki /dla-restauracji w PostHog (ten sam projekt co apka; strona = $host spootme.pl).
// Bez ciasteczek i bez zapisu w przeglądarce, więc bez banera zgody: każde wejście dostaje nowe losowe id.
// Skąd ktoś przyszedł: ?utm_source=… (mail, sms, strona-glowna…) albo `qr_likely` — kod QR z wizytówek
// prowadzi na gołe spootme.pl/dla-restauracji, więc skan = telefon + brak strony poprzedniej + brak utm.
// ponytail: wpisanie adresu z wizytówki ręcznie na telefonie też liczy się jako skan; rozdzielić się nie da bez nowego kodu QR.
const KEY = 'phc_C7CCDonoDEAq9vJF4ZXQj3HViTxUZbtfnj348Dc4Rj4C';
const ENDPOINT = 'https://eu.i.posthog.com/capture/';

let visitId = '';

function base() {
  const q = new URLSearchParams(location.search);
  const utm = Object.fromEntries([...q].filter(([k]) => k.startsWith('utm_')));
  const mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  return {
    $current_url: location.href,
    $host: location.host,
    $pathname: location.pathname,
    $referrer: document.referrer || '$direct',
    $referring_domain: document.referrer ? new URL(document.referrer).host : '$direct',
    $device_type: mobile ? 'Mobile' : 'Desktop',
    $process_person_profile: false,
    ...utm,
    qr_likely: location.pathname === '/dla-restauracji' && mobile && !document.referrer && !q.has('utm_source'),
  };
}

export function track(event: string, props: Record<string, unknown> = {}) {
  try {
    visitId ||= crypto.randomUUID();
    const body = JSON.stringify({ api_key: KEY, event, distinct_id: visitId, properties: { ...base(), ...props } });
    // sendBeacon przeżywa przejście na inną stronę (klik w „Zgłoś swój lokal”) i nie wymaga zapytania wstępnego CORS.
    if (!navigator.sendBeacon?.(ENDPOINT, body)) fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {});
  } catch { /* statystyki nigdy nie psują strony */ }
}
