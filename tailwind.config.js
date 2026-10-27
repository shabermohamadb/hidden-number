/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hn: {
          bg: '#070B0D',
          surface: '#101719',
          elevated: '#151D1D',
          primary: '#A8C66C',
          primaryHover: '#B8D47C',
          text: '#F1EBDD',
          textMuted: '#A8ADA7',
          border: '#293130',
          borderLight: '#394341',
          gold: '#C6A45A',
          goldMuted: 'rgba(198, 164, 90, 0.25)',
          error: '#E05D52',
          success: '#A8C66C'
        },
        arena: {
          bg: '#070B0D',
          dark: '#101719',
          stone: '#151D1D',
          surface: '#151D1D',
          surfaceLight: '#1E2728',
          border: '#293130',
          borderGold: 'rgba(198, 164, 90, 0.35)',
          borderHover: '#3D4948',
          gold: '#C6A45A',
          goldGleam: '#E2CA88',
          goldDeep: '#9E7E38',
          bronze: '#C6A45A',
          bronzeDeep: '#8E7337',
          ivory: '#F1EBDD',
          stoneMuted: '#A8ADA7',
          amber: '#E5A83B',
          emerald: '#A8C66C',
          rose: '#E05D52'
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
