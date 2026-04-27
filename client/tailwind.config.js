/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#e85d04",
          "orange-hover": "#cf5304",
          green: "#76b82a",
          "green-hover": "#689d25",
          ink: "#1a1a1a",
          muted: "#6b7280",
          surface: "#f6f7f8",
        },
      },
    },
  },
  plugins: [],
};
