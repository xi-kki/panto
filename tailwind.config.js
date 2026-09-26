/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Panto palette — from Master PRD v5
        cream: '#FAF9F6',      // background
        charcoal: '#1A1A1A',   // primary text
        terracotta: '#C45C26', // accent / CTA
        'terracotta-alt': '#D97941',
        sage: '#8A9A7B',       // secondary accent, doormat, chat widget
        'sage-dark': '#4A7043', // success / closed deals
        beige: '#E9E2D8',      // inactive toggle
        border: '#E8E4DE',     // subtle borders
        footprint: '#B8B0A8',  // ghosted footprints
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 24px rgba(0,0,0,0.12)',
        pill: '0 2px 10px rgba(26,26,26,0.06)',
      },
    },
  },
  plugins: [],
}
