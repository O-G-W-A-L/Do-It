/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.css",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Color: Deep Electric Blue
        brand: {
          blue: '#2563EB',      // Primary brand color
          'blue-light': '#3B82F6',  // Hover states
          'blue-dark': '#1D4ED8',   // Active states
        },
        // Neutral Grays - Clean and Professional
        gray: {
          50: '#F8FAFC',   // Background
          100: '#F1F5F9',  // Surface light
          200: '#E2E8F0',  // Borders
          300: '#CBD5E1',  // Dividers
          400: '#94A3B8',  // Text muted
          500: '#64748B',  // Text secondary
          600: '#475569',  // Text primary
          700: '#334155',  // Headings
          800: '#1E293B',  // Dark headings
          900: '#0F172A',  // Darkest
        },
        // Semantic Colors
        success: '#059669',  // Green
        error: '#DC2626',   // Red
        warning: '#D97706', // Amber
        info: '#2563EB',    // Blue
        // Minimal Accent
        accent: {
          cyan: '#06B6D4',    // For highlights
          amber: '#F59E0B',   // For achievements
        },
      },
      fontFamily: {
        // Heading font: Poppins
        heading: ['Poppins', 'sans-serif'],
        // Body font: Inter
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        // Custom font sizes for the design system
        'hero-mobile': ['38px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        'hero-desktop': ['72px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'h2-mobile': ['28px', { lineHeight: '1.3', letterSpacing: '-0.01em' }],
        'h2-desktop': ['48px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'h3-mobile': ['20px', { lineHeight: '1.4', letterSpacing: '0' }],
        'h3-desktop': ['28px', { lineHeight: '1.3', letterSpacing: '0' }],
        'body-mobile': ['15px', { lineHeight: '1.6' }],
        'body-desktop': ['18px', { lineHeight: '1.8' }],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out',
        'fade-in': 'fadeIn 0.6s ease-in',
        'slide-in-left': 'slideInLeft 0.6s ease-in',
        'float': 'float 4s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(41, 121, 255, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(41, 121, 255, 0.6)' },
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1E2A78 0%, #111315 100%)',
        'cta-gradient': 'linear-gradient(135deg, #2979FF 0%, #00E5FF 100%)',
      },
    },
  },
  plugins: [],
}
