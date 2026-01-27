import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cultr: {
          // Primary greens
          forest: '#1B4332',
          forestLight: '#2D6A4F',
          forestDark: '#0D2818',

          // Accent greens
          sage: '#B7E4C7',
          mint: '#D8F3DC',

          // Neutrals
          offwhite: '#FAFAF9',
          text: '#1A1A1A',
          textMuted: '#6B7280',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
