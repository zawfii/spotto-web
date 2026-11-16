'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

/** Czyta kod QR z kamery komputera. Natywny BarcodeDetector tam, gdzie jest (Chrome na Macu),
 *  w innych przeglądarkach jsQR na klatkach z <canvas>. */
export default function QrScanner({ onCode }: { onCode: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const [error, setError] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;

    const Native = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    const detector = Native ? new Native({ formats: ['qr_code'] }) : null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    async function scan() {
      const video = videoRef.current;
      if (stopped || !video) return;
      if (video.readyState >= 2) {
        let code: string | undefined;
        if (detector) {
          code = (await detector.detect(video).catch(() => []))[0]?.rawValue;
        } else if (ctx && video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data;
        }
        if (code && !stopped) { onCodeRef.current(code); return; }
      }
      timer = window.setTimeout(scan, 250);
    }

    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'environment' } })
      .then(s => {
        stream = s;
        if (stopped) { s.getTracks().forEach(t => t.stop()); return; }
        const video = videoRef.current!;
        video.srcObject = s;
        video.play().catch(() => {});
        scan();
      })
      .catch(() => setError('Nie mamy dostępu do kamery. Zezwól na nią w przeglądarce (ikona obok adresu strony) i spróbuj ponownie.'));

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  if (error) return <p role="alert" className="rounded-xl bg-spoot-tint p-4">{error}</p>;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-spoot-ink">
      <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-[18%] rounded-2xl border-2 border-white/80" />
    </div>
  );
}
