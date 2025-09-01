/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a5b8fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        gray: {
          850: '#1f2937',
          950: '#0f0f23',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': `
          radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.3) 0px, transparent 0%),
          radial-gradient(at 97% 21%, hsla(225, 15%, 80%, 0.2) 0px, transparent 50%),
          radial-gradient(at 52% 99%, hsla(254, 98%, 80%, 0.3) 0px, transparent 50%),
          radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 0.2) 0px, transparent 50%),
          radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 0.1) 0px, transparent 50%),
          radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 0.3) 0px, transparent 50%),
          radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 0.2) 0px, transparent 50%)
        `,
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.8s ease-out',
        'slide-in-right': 'slideInRight 0.8s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(99, 102, 241, 0.6), 0 0 60px rgba(99, 102, 241, 0.3)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-lg': '0 0 30px rgba(99, 102, 241, 0.4)',
        'glow-xl': '0 0 40px rgba(99, 102, 241, 0.5)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
      },
      screens: {
        'xs': '475px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
        },
        '.glass-strong': {
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
        },
        '.text-gradient': {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.bg-mesh': {
          backgroundImage: `
            radial-gradient(at 27% 37%, hsla(215, 98%, 61%, 0.3) 0px, transparent 0%),
            radial-gradient(at 97% 21%, hsla(225, 15%, 80%, 0.2) 0px, transparent 50%),
            radial-gradient(at 52% 99%, hsla(254, 98%, 80%, 0.3) 0px, transparent 50%),
            radial-gradient(at 10% 29%, hsla(256, 96%, 67%, 0.2) 0px, transparent 50%),
            radial-gradient(at 97% 96%, hsla(38, 60%, 74%, 0.1) 0px, transparent 50%),
            radial-gradient(at 33% 50%, hsla(222, 67%, 73%, 0.3) 0px, transparent 50%),
            radial-gradient(at 79% 53%, hsla(343, 68%, 79%, 0.2) 0px, transparent 50%)
          `,
        },
      }
      addUtilities(newUtilities)
    }
  ],
}