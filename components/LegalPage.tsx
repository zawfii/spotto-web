import { Wordmark } from './SpootLogo';

// Wspólna oprawa stron prawnych. `html` to nasza własna, statyczna treść (nie dane użytkownika).
const css = `
.legal{min-height:100vh;background:#fbfaeb;color:#1d2b25;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.6;padding:32px 16px 64px}
.legal main{max-width:720px;margin:0 auto}
.legal .brand{display:inline-block;margin-bottom:24px;color:#164938;font-weight:800;font-size:22px;text-decoration:none}
.legal h1{font-size:30px;line-height:1.2;color:#164938;margin:0 0 12px}
.legal h2{font-size:21px;color:#164938;margin:40px 0 12px}
.legal h3{font-size:17px;margin:28px 0 8px}
.legal p,.legal ul,.legal ol{margin:0 0 14px}
.legal ul,.legal ol{padding-left:22px}
.legal ul{list-style:disc}
.legal ol{list-style:decimal}
.legal li{margin-bottom:6px}
.legal a{color:#164938}
.legal hr{border:0;border-top:1px solid #d9d7c3;margin:40px 0 16px}
.legal .tbl{overflow-x:auto;margin:0 0 18px}
.legal table{border-collapse:collapse;width:100%;font-size:14px}
.legal th,.legal td{border:1px solid #d9d7c3;padding:8px 10px;text-align:left;vertical-align:top}
.legal th{background:#f0eedb}
`;

export default function LegalPage({ html }: { html: string }) {
  return (
    <div className="legal">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <main>
        <a className="brand" href="/"><Wordmark size={26} /></a>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </main>
    </div>
  );
}
