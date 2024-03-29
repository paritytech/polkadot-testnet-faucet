module.exports = {
  content: ["./src/**/*.{js,svelte,ts}", "./src/**/*.html"],
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: { themes: ["dark"], logs: false },
};
