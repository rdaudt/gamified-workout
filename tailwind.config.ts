import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#081218',
        panel: '#11212b',
        panelAlt: '#152934',
        ink: '#f4efe7',
        accent: '#f06d4f',
        accentSoft: '#ffd1b0',
        line: '#274252',
        signal: '#8ad1c2',
      },
      boxShadow: {
        glow: '0 24px 80px rgba(240, 109, 79, 0.18)',
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
