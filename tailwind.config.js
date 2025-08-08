/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // Add other paths as needed
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'), // This is crucial for rendering Tiptap content
  ],
}