/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#EEF2F8', 100: '#D9E1EE', 200: '#B3C2DC', 300: '#8099C2', 400: '#4F6FA3',
          500: '#2F5088', 600: '#1F3B6C', 700: '#172E56', 800: '#112243', 900: '#0B1A33', 950: '#071122',
        },
        gold: {
          50: '#FBF7EC', 100: '#F5EBCD', 200: '#EBD69C', 300: '#DFBE69', 400: '#D2A845',
          500: '#C29234', 600: '#A6772A', 700: '#855C24', 800: '#6D4B23', 900: '#5B3F21',
        },
        ivory: '#FAF8F3',
        mist: '#F3F5F8',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,26,51,0.04), 0 4px 16px rgba(11,26,51,0.06)',
        lift: '0 2px 4px rgba(11,26,51,0.04), 0 12px 32px rgba(11,26,51,0.10)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' }, screens: { '2xl': '1280px' } },
    },
  },
  plugins: [],
};
