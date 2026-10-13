/** @type {import('tailwindcss').Config} */

// Lets opacity modifiers (bg-brandPrimary/20, shadow-brandPrimary/30, ...) work with CSS variable colors
const cssVar = (name) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `var(${name})`
    : `color-mix(in srgb, var(${name}) calc(${opacityValue} * 100%), transparent)`;

export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Outfit', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Page & Surface layers
        base:         cssVar('--bg-base'),
        page:         cssVar('--bg-page'),
        background:   cssVar('--bg-page'),
        surface:      cssVar('--bg-surface'),
        elevated:     cssVar('--bg-elevated'),
        muted:        cssVar('--bg-muted'),
        surfaceMuted: cssVar('--bg-muted'),
        overlay:      cssVar('--bg-overlay'),

        // Borders
        border:        cssVar('--border-subtle'),
        'border-subtle': cssVar('--border-subtle'),
        'border-soft':   cssVar('--border-soft'),
        'border-medium': cssVar('--border-medium'),

        // Text
        heading:   cssVar('--text-heading'),
        mainText:  cssVar('--text-heading'),
        body:      cssVar('--text-body'),
        subText:   cssVar('--text-body'),
        mutedText: cssVar('--text-muted'),
        subtle:    cssVar('--text-subtle'),

        // Brand
        brandPrimary: cssVar('--brand-primary'),
        brandBlue:    cssVar('--brand-primary'),
        brandAccent:  cssVar('--brand-accent'),
        brandRed:     cssVar('--brand-accent'),
        brandGlow:    cssVar('--brand-glow'),
      },
      boxShadow: {
        'sm':   'var(--shadow-sm)',
        'md':   'var(--shadow-md)',
        'lg':   'var(--shadow-lg)',
        'xl':   'var(--shadow-xl)',
        'blue': 'var(--shadow-blue)',
        'red':  'var(--shadow-red)',
        'glow': '0 0 0 1px rgba(37, 99, 235, 0.4), 0 0 20px rgba(37, 99, 235, 0.25)',
        'card': '0 4px 16px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,99,235,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        'gradient-blue':  'linear-gradient(135deg, #60a5fa, #2563eb)',
        'gradient-hero':  'radial-gradient(ellipse 100% 60% at 50% 0%, rgba(37, 99, 235, 0.12) 0%, transparent 70%)',
        'gradient-card':  'linear-gradient(135deg, #111d30 0%, #0d1525 100%)',
      },
      animation: {
        'fadeInUp': 'fadeInUp 0.4s ease both',
        'fadeIn': 'fadeIn 0.3s ease both',
        'slideInRight': 'slideInRight 0.35s ease both',
        'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}