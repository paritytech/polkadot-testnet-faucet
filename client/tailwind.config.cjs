const tailwind = require("@frequency-chain/style-guide/tailwind");

module.exports = {
	...tailwind,
	content: ["./src/**/*.{js,svelte,ts}", "./src/**/*.html"],
	plugins: [require("daisyui"), require("@tailwindcss/typography")],
	daisyui: { themes: ["dark"], logs: false }
};
