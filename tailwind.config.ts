import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          primary: '#2B4542',
          primaryHover: '#1F3533',
          primaryLight: '#3D5E5B',
          cream: '#F7F6E8',
          creamDark: '#F0EDDF',
        },
        // Primary brand color shortcuts (for easier use)
        forest: {
          DEFAULT: '#2B4542',
          light: '#3D5E5B',
          dark: '#1F3533',
          muted: '#6B7280',
        },
        cream: {
          DEFAULT: '#F7F6E8',
          dark: '#F0EDDF',
        },
        sage: '#B7E4C7',
        mint: '#D7F3DC',
        // Aura gradient colors (decorative)
        aura: {
          purple: '#9333EA',
          lavender: '#E9D5FF',
          sage: '#10B981',
          mint: '#D1FAE5',
          orange: '#F97316',
          peach: '#FFEDD5',
          yellow: '#FDE047',
        },
        // Legacy colors (kept for compatibility)
        cultr: {
          forest: '#2B4542',
          forestLight: '#3D5E5B',
          forestDark: '#1F3533',
          sage: '#B7E4C7',
          mint: '#D7F3DC',
          offwhite: '#F7F6E8',
          text: '#2B4542',
          textMuted: '#6B7280',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Playfair Display', 'Georgia', 'serif'],
        fraunces: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'blur-in': 'blurIn 0.6s ease-out forwards',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(42, 69, 66, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(42, 69, 66, 0.25)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
