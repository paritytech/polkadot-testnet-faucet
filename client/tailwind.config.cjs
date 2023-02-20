/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,svelte,ts}', './index.html'],
    theme: {
        extend: {},
    },
    plugins: [require('daisyui')],
}

