'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Btn, Card, CardTitle } from './ui';

const INK = '#03271a';

/** Kod QR do publicznej karty lokalu (spootme.pl/place/[id]) — do wydruku na stoliki. */
export default function MenuQr({ placeId }: { placeId: string }) {
  const url = `https://spootme.pl/place/${placeId}`;
  const [svg, setSvg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: INK, light: '#ffffff' } }).then(setSvg);
  }, [url]);

  async function downloadPng() {
    const href = await QRCode.toDataURL(url, { width: 1200, margin: 2, color: { dark: INK, light: '#ffffff' } });
    const a = document.createElement('a');
    a.href = href;
    a.download = 'spoot-menu-qr.png';
    a.click();
  }

  // PDF przez okno druku przeglądarki („Zapisz jako PDF”) — bez biblioteki do PDF.
  function printPdf() {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>Menu — kod QR</title>
<style>@page{size:A5;margin:0}body{margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;font-family:system-ui,sans-serif;color:${INK}}
h1{margin:0;font-size:28px}p{margin:0;font-size:16px}svg{width:70vw;max-width:360px;height:auto}</style></head>
<body><h1>Zeskanuj i zobacz menu</h1>${svg}<p>spootme.pl</p></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="flex min-w-0 flex-[1_1_400px] flex-wrap items-center gap-5">
      <div
        role="img"
        aria-label="Kod QR do menu lokalu"
        className="h-[172px] w-[172px] shrink-0 rounded-2xl bg-white p-3 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>Kod QR do menu</CardTitle>
          <p className="text-spoot-ink2">Wydrukuj i postaw na stolikach. Goście skanują kod telefonem i widzą Twoją aktualną kartę — zmiany w menu nie wymagają nowego wydruku.</p>
        </div>
        <span className="self-start break-all rounded-lg bg-spoot-input px-2.5 py-1.5 font-display text-[13px] font-semibold">{url.replace('https://', '')}</span>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={printPdf} disabled={!svg}>Drukuj / PDF</Btn>
          <Btn variant="outline" onClick={downloadPng}>Pobierz PNG</Btn>
          <Btn variant="ghost" onClick={copy}>{copied ? 'Skopiowano' : 'Kopiuj link'}</Btn>
        </div>
      </div>
    </Card>
  );
}
