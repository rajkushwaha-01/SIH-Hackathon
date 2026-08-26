/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Stitch Safety Intelligence Core Palette
        primary: {
          DEFAULT: '#003d9b',
          container: '#0052cc',
          'on-container': '#c4d2ff',
          fixed: '#dae2ff',
          'fixed-dim': '#b2c5ff',
          'on-fixed': '#001848',
          'on-fixed-variant': '#0040a2',
        },
        secondary: {
          DEFAULT: '#5c5e63',
          container: '#e1e2e8',
          'on-container': '#626469',
          fixed: '#e1e2e8',
          'fixed-dim': '#c5c6cc',
        },
        tertiary: {
          DEFAULT: '#3c454c',
          container: '#535c64',
          'on-container': '#cbd4dd',
          fixed: '#dbe4ed',
          'fixed-dim': '#bfc8d0',
        },
        surface: {
          DEFAULT: '#faf8ff',
          bright: '#faf8ff',
          dim: '#d9d9e4',
          tint: '#0c56d0',
          variant: '#e1e2ec',
          container: {
            lowest: '#ffffff',
            low: '#f3f3fd',
            DEFAULT: '#ededf8',
            high: '#e7e7f2',
            highest: '#e1e2ec',
          }
        },
        background: '#faf8ff',
        'on-background': '#191b23',
        'on-surface': '#191b23',
        'on-surface-variant': '#434654',
        'on-primary': '#ffffff',
        'on-secondary': '#ffffff',
        'on-tertiary': '#ffffff',
        outline: {
          DEFAULT: '#737685',
          variant: '#c3c6d6',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          'on-container': '#93000a',
          'on-error': '#ffffff',
        },
        // Semantic Safety Levels
        safety: {
          green: '#2E7D32',
          'green-bg': '#E8F5E9',
          amber: '#F57F17',
          'amber-bg': '#FFF8E1',
          red: '#BA1A1A',
          'red-bg': '#FFDAD6',
        }
      },
      borderRadius: {
        DEFAULT: '0.25rem', // 4px
        sm: '0.125rem',     // 2px
        md: '0.375rem',     // 6px
        lg: '0.5rem',       // 8px
        xl: '0.75rem',      // 12px
        '2xl': '1rem',      // 16px
        full: '9999px',
      },
      spacing: {
        base: '4px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        gutter: '24px',
        'margin-mobile': '16px',
        'margin-desktop': '32px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(25, 27, 35, 0.05)',
        card: '0 2px 8px rgba(26, 29, 33, 0.04)',
        elevated: '0px 4px 12px rgba(26, 29, 33, 0.08)',
        modal: '0 12px 32px rgba(26, 29, 33, 0.16)',
      }
    },
  },
  plugins: [],
};
