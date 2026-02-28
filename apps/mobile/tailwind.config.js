/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          light: '#818CF8',
          bg: '#EEF2FF',
        },
        success: {
          DEFAULT: '#10B981',
          bg: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#EF4444',
          bg: '#FEE2E2',
        },
        // Kategória színek
        'cat-food': '#F97316',
        'cat-transport': '#3B82F6',
        'cat-shopping': '#EC4899',
        'cat-entertainment': '#8B5CF6',
        'cat-health': '#10B981',
        'cat-housing': '#6366F1',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        mono: ['JetBrainsMono_500Medium'],
      },
    },
  },
  plugins: [],
};
