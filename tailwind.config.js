/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#3B82F6',
        },
        surface: {
          DEFAULT: '#0F172A',
          card: '#1E293B',
          muted: '#334155',
        },
        accent: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
    },
  },
  plugins: [],
};
