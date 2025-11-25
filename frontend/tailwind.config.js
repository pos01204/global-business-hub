/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4A6FA5',
        secondary: '#34495e',
        accent: '#F79F79',
        success: '#27ae60',
        danger: '#c0392b',
        warning: '#f39c12',
        info: '#17a2b8',
      },
    },
  },
  plugins: [],
}


