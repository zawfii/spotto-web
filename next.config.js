/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async redirects() {
    // Na razie strona główna = landing na www (repo spoot-landing). Linki z apki
    // (/join-group, /u, /place, /list, AASA) zostają tutaj. Tymczasowe (307), nie 308.
    return [{ source: '/', destination: 'https://www.spootme.pl/', permanent: false }];
  },
  async headers() {
    // Apple pobiera ten plik bez rozszerzenia — musi przyjść jako JSON.
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ];
  },
};

module.exports = nextConfig;
