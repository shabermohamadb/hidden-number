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
          bg: '#06080F',
          dark: '#0B0F19',
          surface: '#111726',
          surfaceLight: '#182138',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(56, 189, 248, 0.3)',
          cyan: '#38BDF8',
          violet: '#818CF8',
          neon: '#06B6D4',
          accent: '#6366F1',
          amber: '#F59E0B',
          emerald: '#10B981',
          rose: '#F43F5E'
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
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(56, 189, 248, 0.2)' },
          '100%': { boxShadow: '0 0 35px rgba(129, 140, 248, 0.4)' },
        }
      }
    },
  },
  plugins: [],
}
