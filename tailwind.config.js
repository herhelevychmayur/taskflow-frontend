/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#0f172a',
        primary: '#3b82f6',
        'primary-hover': '#2563eb',
        surface: '#f8fafc',
        border: '#e2e8f0',
        error: '#ef4444',
      }
    },
  },
  plugins: [],
}
