/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F3732A',
          dark: '#D95F1A',
          light: '#FEF0E6',
        },
        accent: '#1A1A2E',
        bg: {
          DEFAULT: '#F7F7F7',
          dark: '#0F0F1A',
        },
        surface: '#FFFFFF',
        text: {
          primary: '#1A1A2E',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        border: '#E5E7EB',
        success: '#22C55E',
        warning: '#F59E0B',
        error: '#EF4444',
        rating: '#FBBF24',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
