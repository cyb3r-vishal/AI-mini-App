import type { Config } from 'tailwindcss';

/**
 * Design system — "BlockKit"
 * Cartoon + Minecraft-inspired. Blocky shapes, soft chunky shadows,
 * pixel-like feel with modern typography.
 */
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // --- Breakpoints: add xs for tight phones ---------------------------
      screens: {
        xs: '400px',
      },
      // --- Color palette: bright but minimal -----------------------------
      colors: {
        // Neutral surfaces — paperlike
        paper: {
          50: '#fafaf7',
          100: '#f4f3ec',
          200: '#e7e5d8',
          300: '#d6d3c1',
          400: '#b0ac95',
          500: '#85836e',
          600: '#5a5947',
          700: '#3c3b2f',
          800: '#26251d',
          900: '#17161023',
        },
        // Brand — a friendly grass green with good contrast
        brand: {
          50: '#effbf0',
          100: '#d6f4d8',
          200: '#a6e6ab',
          300: '#6fd27a',
          400: '#3fb84e',
          500: '#259c34',
          600: '#1b7a28',
          700: '#166022',
          800: '#124c1d',
          900: '#0d3715',
        },
        // Accent — sky
        sky: {
          50: '#eff8ff',
          100: '#d9ecff',
          200: '#b6dbff',
          300: '#85c4ff',
          400: '#4ea6ff',
          500: '#2288f2',
          600: '#156cd1',
          700: '#1256a6',
          800: '#0f447f',
          900: '#0a2f58',
        },
        // Sun — warm highlight for emphasis
        sun: {
          50: '#fff9e5',
          100: '#ffefb8',
          200: '#ffe07a',
          300: '#ffcd3f',
          400: '#f5b200',
          500: '#c99100',
          600: '#9a6e00',
        },
        // Danger
        ember: {
          50: '#fff1ee',
          100: '#ffddd3',
          200: '#ffb4a0',
          300: '#ff8867',
          400: '#f2593a',
          500: '#d23c22',
          600: '#a12a15',
        },
        // Night — dark, premium surfaces used on marketing/landing pages
        // (Base44-inspired: near-black with slight blue, high contrast
        // on white/brand accents).
        night: {
          50: '#f5f6fa',
          100: '#e3e5ef',
          200: '#bec2d4',
          300: '#8b92ad',
          400: '#5a6281',
          500: '#343b58',
          600: '#212641',
          700: '#141830',
          800: '#0b0e22',
          900: '#05061a',
          950: '#020314',
        },
      },
      // --- Typography ----------------------------------------------------
      fontFamily: {
        sans: [
          'InterVariable',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        display: [
          '"Press Start 2P"',
          '"VT323"',
          'InterVariable',
          'system-ui',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        // 4pt scale
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
      },
      // --- Blocky corners ------------------------------------------------
      borderRadius: {
        // Intentionally tight — blocks, not pills.
        block: '6px',
        'block-lg': '10px',
        'block-xl': '14px',
      },
      borderWidth: {
        '3': '3px',
      },
      // --- Chunky soft shadows (the signature look) ----------------------
      boxShadow: {
        // Solid offset — Minecraft-style block drop.
        block: '0 3px 0 0 rgb(0 0 0 / 0.12), 0 6px 0 -1px rgb(0 0 0 / 0.08)',
        'block-sm': '0 2px 0 0 rgb(0 0 0 / 0.12)',
        'block-lg':
          '0 4px 0 0 rgb(0 0 0 / 0.14), 0 10px 20px -10px rgb(0 0 0 / 0.2)',
        // Pressed-in state.
        inset: 'inset 0 2px 0 0 rgb(0 0 0 / 0.15)',
        // Soft glow for focus rings.
        focus: '0 0 0 3px rgb(63 184 78 / 0.35)',
        'focus-sky': '0 0 0 3px rgb(78 166 255 / 0.35)',
        'focus-ember': '0 0 0 3px rgb(242 89 58 / 0.35)',
      },
      // --- Spacing additions --------------------------------------------
      spacing: {
        '18': '4.5rem',
      },
      // --- Animations ---------------------------------------------------
      keyframes: {
        'press-in': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(2px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'blob-drift': {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(20px,-30px,0) scale(1.08)' },
        },
        'blink-caret': {
          '0%,50%': { opacity: '1' },
          '50.01%,100%': { opacity: '0' },
        },
      },
      animation: {
        'press-in': 'press-in 0.08s ease-out forwards',
        'fade-up': 'fade-up 0.6s ease-out both',
        'blob-drift': 'blob-drift 14s ease-in-out infinite',
        'blink-caret': 'blink-caret 1s steps(2) infinite',
      },
      backgroundImage: {
        'grid-night':
          'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'radial-spot':
          'radial-gradient(60% 60% at 50% 0%, rgba(63,184,78,0.15) 0%, rgba(11,14,34,0) 60%)',
      },
      backgroundSize: {
        'grid-24': '24px 24px',
      },
    },
  },
  plugins: [],
};

export default config;
