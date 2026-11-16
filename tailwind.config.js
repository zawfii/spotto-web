/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Jak constants/theme.ts w apce.
      colors: {
        spoot: {
          surface: '#fdf5ec',
          ink: '#03271a',
          ink2: '#1e3028',
          green: '#164938',
          orange: '#ff751f',
          tint: '#ffe5d4',
          card: '#eae5de',
          chip: '#d3cdc5',
          input: '#fffcf8',
          line: 'rgba(3,39,26,0.15)',
          danger: '#b3261e',
        },
      },
      fontFamily: {
        display: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
        body: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
