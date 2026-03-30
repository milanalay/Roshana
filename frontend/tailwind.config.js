/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // NurseReady brand palette
        'nr-primary':     '#1B3A6B',   // Deep navy — primary actions, headings
        'nr-accent':      '#00A99D',   // Teal — accent, active states, progress
        'nr-safe':        '#10B981',   // Emerald — safe/normal indicators
        'nr-caution':     '#F59E0B',   // Amber — caution, warnings
        'nr-critical':    '#EF4444',   // Red — critical, hold, danger
        'nr-pharm':       '#8B5CF6',   // Purple — pharmacology accent
        'nr-emergency':   '#F97316',   // Orange — emergency, high-alert drugs
        'nr-info':        '#3B82F6',   // Blue — informational
        'nr-surface':     '#F4F6F9',   // Light grey — page background
        'nr-card':        '#FFFFFF',   // White — card backgrounds
        // Category colours (matching categoryColors in drugs.js)
        'cat-pain':       '#8B5CF6',
        'cat-diabetes':   '#10B981',
        'cat-cardiac':    '#EF4444',
        'cat-anticoag':   '#F59E0B',
        'cat-gi':         '#F97316',
        'cat-resp':       '#3B82F6',
        'cat-mental':     '#EC4899',
        'cat-other':      '#6B7280',
      },
      fontFamily: {
        heading: ['Manrope', 'system-ui', 'sans-serif'],
        body:    ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        sans:    ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',    // 12px — base
        'xl':    '1rem',       // 16px
        '2xl':   '1rem',       // NurseReady default card radius
        '3xl':   '1.5rem',     // Large sheets
        'full':  '9999px',     // Pills and badges
      },
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }],  // 10px
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-top':    'env(safe-area-inset-top, 0px)',
      },
      minHeight: {
        'touch': '44px',   // WCAG minimum touch target
        'nav':   '56px',   // Bottom nav bar height
      },
      minWidth: {
        'touch': '44px',
      },
      boxShadow: {
        'card':  '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'sheet': '0 -4px 24px rgba(0,0,0,0.12)',
        'float': '0 4px 16px rgba(27,58,107,0.20)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1B3A6B 0%, #2d5fa8 100%)',
        'gradient-accent':  'linear-gradient(90deg, #00A99D, #1B3A6B)',
      },
      transitionDuration: {
        '250': '250ms',
      },
      animation: {
        'slide-up':   'slideUp 0.25s ease-out',
        'fade-in':    'fadeIn 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideUp: {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
