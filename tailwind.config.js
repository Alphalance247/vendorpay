/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f7f9fb',
        'surface-dim': '#d8dadc',
        'surface-lowest': '#ffffff',
        'surface-low': '#f2f4f6',
        'surface-container': '#eceef0',
        'surface-high': '#e6e8ea',
        'surface-highest': '#e0e3e5',
        'on-surface': '#191c1e',
        'on-surface-variant': '#44474b',
        outline: '#74777c',
        'outline-variant': '#c4c6cc',
        primary: '#0f1d29',
        'on-primary': '#ffffff',
        secondary: '#006c49',
        'on-secondary': '#ffffff',
        'secondary-container': '#6cf8bb',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        navy: '#0f1d29',
        emerald: '#006c49',
        'emerald-light': '#6cf8bb',
        amber: '#d97706',
        'amber-dark': '#b45309',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      maxWidth: {
        content: '1440px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.04)',
        dropdown: '0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
};

