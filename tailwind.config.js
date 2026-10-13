/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ---- Alluvium VendorPay design system ----
        // Updated to the official Alluvium brand color spec (confirmed with
        // the user 2026-10-13), which supersedes the earlier values pulled
        // from the live alluvium.net site. DESIGN.md was already out of
        // sync with tailwind.config.js before this change (it documents a
        // third, different set of hex values) and has not been reconciled
        // here, this file is the live source of truth.

        // Brand reference colours. Fills/accents only: white text on
        // brand-orange or brand-cyan does not meet WCAG AA at normal text
        // sizes.
        'brand-orange': '#F79009',
        'brand-orange-dark': '#DE8208',
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
        'on-surface-variant': '#344054',
        'inverse-surface': '#0C111D',
        'inverse-on-surface': '#F2F4F7',
        outline: '#D0D5DD',
        'outline-variant': '#E4E7EC',
        navy: '#0C111D',

        // Action orange: the official brand primary (same value as
        // brand-orange above). White text on this orange measures ~3.3:1,
        // which fails the 4.5:1 WCAG AA minimum for normal text and also
        // falls short of the large-text exception (needs 14pt/~18.7px
        // bold or larger; our buttons run 14 to 16px). Deliberate
        // brand-over-audit call, confirmed with the user, not an oversight.
        primary: '#F79009',
        'on-primary': '#FFFFFF',
        'primary-fixed': '#FCF2E8',
        'primary-fixed-dim': '#F6D5B6',

        // Interactive cyan: the official brand secondary, for links and
        // secondary buttons (same value as brand-cyan above). White text on
        // this cyan measures ~3.25:1, same AA shortfall as primary above.
        secondary: '#009BC0',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#E9F6FA',
        'secondary-fixed': '#CBEAF2',
        'secondary-fixed-dim': '#4FC0D9',

        // Status colours, per the official brand spec. Success is now an
        // actual green, reversing the earlier "Alluvium has no green, use
        // cyan instead" rule from this file's previous version.
        success: '#039855',
        'success-container': '#E7F6EC',
        warning: '#DC6803',
        'warning-container': '#FBF0DC',
        error: '#D92D20',
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
