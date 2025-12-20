/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fdf2f2',
          100: '#fde8e8',
          600: '#e11d48', // Màu đỏ giảm giá
          800: '#9f1239', // Màu đỏ thương hiệu chính
          900: '#881337',
        }
      }
    },
  },
  plugins: [],
}