/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: '#07080B',
          dark: '#0D1017',
          stone: '#131722',
          surface: '#181E2C',
          surfaceLight: '#21293C',
          border: 'rgba(197, 160, 89, 0.2)',
          borderGold: 'rgba(212, 175, 55, 0.35)',
          borderHover: 'rgba(212, 175, 55, 0.6)',
          gold: '#D4AF37',
          goldGleam: '#F3E5AB',
          goldDeep: '#9A7B38',
          bronze: '#C5A059',
          bronzeDeep: '#8C6D34',
          ivory: '#F5F2EB',
          stoneMuted: '#8F8B83',
          amber: '#E5A83B',
          emerald: '#10B981',
          rose: '#E11D48'
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow 2.5s ease-in-out infinite alternate',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(212, 175, 55, 0.15)' },
          '100%': { boxShadow: '0 0 35px rgba(212, 175, 55, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
