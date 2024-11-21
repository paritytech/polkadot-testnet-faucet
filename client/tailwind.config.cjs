import frequencyConfig from "@frequency-chain/style-guide/tailwind.config";

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,svelte,ts}", "./src/**/*.html"],
	plugins: [require("daisyui"), require("@tailwindcss/typography")],
	daisyui: { themes: ["light"], logs: false },
  presets: [frequencyConfig],
  theme: {
    extend: {
      fontFamily: {
        title: ['Newake', 'sans-serif'],
        sans: ['Poppins', 'sans-serif'],
      },
    }
  }
};
