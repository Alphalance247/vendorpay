/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ---- Alluvium VendorPay design system (see DESIGN.md) ----
        // Every value here comes from the Alluvium brand: either the live
        // alluvium.net site or the Alluvium design kit. Do not add colours
        // from outside these sources, and do not use raw Tailwind palettes
        // (gray-*, blue-*, emerald-*, ...) in components.

        // Brand reference colours (alluvium.net). Fills/accents only: white
        // text on brand-orange or brand-cyan does not meet WCAG AA.
        'brand-orange': '#E37915',
        'brand-orange-dark': '#CF6E13',
        'brand-cyan': '#009BC0',
        'brand-cyan-dark': '#008DAF',

        // Neutrals: alluvium.net grey ramp.
        surface: '#F9FAFB',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F9FAFB',
        'surface-container': '#F2F4F7',
        'surface-container-high': '#EAECF0',
        'surface-container-highest': '#E4E7EC',
        'surface-variant': '#E4E7EC',
        'on-surface': '#1D2939',
        'on-surface-variant': '#475467',
        'inverse-surface': '#0C111D',
        'inverse-on-surface': '#F2F4F7',
        outline: '#98A2B3',
        'outline-variant': '#E4E7EC',
        navy: '#0C111D',

        // Action orange: the darkest orange used on alluvium.net, so white
        // text passes AA (5.45:1). Tints are the site's orange tints.
        primary: '#A1560F',
        'on-primary': '#FFFFFF',
        'primary-fixed': '#FCF2E8',
        'primary-fixed-dim': '#F6D5B6',

        // Interactive cyan: Alluvium kit deep cyan (5.52:1 on white) and tints.
        secondary: '#007387',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#E9F6FA',
        'secondary-fixed': '#CBEAF2',
        'secondary-fixed-dim': '#4FC0D9',

        // Status colours. Alluvium has no green, so success uses the brand
        // deep cyan; warning and danger come from the Alluvium design kit.
        success: '#007387',
        'success-container': '#E9F6FA',
        warning: '#D98A0B',
        'warning-container': '#FBF0DC',
        error: '#D6463C',
        'on-error': '#FFFFFF',
        'error-container': '#FAE7E5',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        'headline-xl': ['Merriweather', 'Georgia', 'serif'],
        'headline-xl-mobile': ['Merriweather', 'Georgia', 'serif'],
        'headline-lg': ['Merriweather', 'Georgia', 'serif'],
        'headline-lg-mobile': ['Merriweather', 'Georgia', 'serif'],
        'headline-md': ['Merriweather', 'Georgia', 'serif'],
        'headline-sm': ['Merriweather', 'Georgia', 'serif'],
        'body-lg': ['Manrope', 'system-ui', 'sans-serif'],
        'body-md': ['Manrope', 'system-ui', 'sans-serif'],
        'body-sm': ['Manrope', 'system-ui', 'sans-serif'],
        'label-caps': ['Manrope', 'system-ui', 'sans-serif'],
        'label-eyebrow': ['Manrope', 'system-ui', 'sans-serif'],
        'code-rail': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        'code-mono-sm': ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'headline-xl': ['48px', { lineHeight: '54px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-xl-mobile': ['34px', { lineHeight: '40px', letterSpacing: '-0.015em', fontWeight: '700' }],
        'headline-lg': ['36px', { lineHeight: '42px', letterSpacing: '-0.015em', fontWeight: '700' }],
        'headline-lg-mobile': ['28px', { lineHeight: '34px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md': ['26px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-sm': ['20px', { lineHeight: '26px', letterSpacing: '0em', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', letterSpacing: '-0.005em', fontWeight: '400' }],
        'body-md': ['15px', { lineHeight: '24px', letterSpacing: '0em', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '20px', letterSpacing: '0.005em', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '700' }],
        'label-eyebrow': ['11px', { lineHeight: '14px', letterSpacing: '0.12em', fontWeight: '700' }],
        'code-rail': ['13px', { lineHeight: '18px', letterSpacing: '0.02em', fontWeight: '500' }],
        'code-mono-sm': ['11px', { lineHeight: '16px', letterSpacing: '0.01em', fontWeight: '500' }],
      },
      // Matches Tailwind's defaults for lg/xl (as used on alluvium.net) while
      // keeping the bare `rounded` at 8px for buttons and inputs.
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      spacing: {
        'space-2': '0.125rem',
        'space-4': '0.25rem',
        'space-8': '0.5rem',
        'space-12': '0.75rem',
        'space-16': '1rem',
        'space-20': '1.25rem',
        'space-24': '1.5rem',
        'space-32': '2rem',
        'space-40': '2.5rem',
        'space-48': '3rem',
        'space-64': '4rem',
        'space-80': '5rem',
        'space-96': '6rem',
        gutter: '1.5rem',
        'margin-desktop': '3rem',
        'margin-tablet': '1.5rem',
        'margin-mobile': '1rem',
      },
      maxWidth: {
        content: '1440px',
      },
      // Tailwind's preflight defaults (border and placeholder greys) are not
      // Alluvium colours; point them at the brand greys instead.
      borderColor: {
        DEFAULT: '#E4E7EC',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(16, 24, 40, 0.06)',
        dropdown: '0px 10px 15px -3px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
};
