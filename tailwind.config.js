/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd', // WCAG AA on dark bg (7.12:1)
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af', // WCAG AA on white (8.59:1)
          900: '#1e3a8a', // WCAG AAA on white (10.67:1)
        },
        // Accessibility-focused color additions
        accessible: {
          text: {
            light: '#111827', // gray-900 - 16.11:1 on white
            'light-muted': '#4B5563', // gray-600 - 7.12:1 on white
            dark: '#F9FAFB', // gray-50 - 15.56:1 on gray-900
            'dark-muted': '#D1D5DB', // gray-300 - 9.73:1 on gray-900
          },
          status: {
            success: '#065F46', // green-800 - 8.27:1 on white
            warning: '#92400E', // amber-800 - 7.48:1 on white
            error: '#991B1B', // red-800 - 7.71:1 on white
            info: '#1E40AF', // blue-800 - 8.59:1 on white
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
