module.exports = {
  content: ["./src/**/*.{js,svelte,ts}", "./src/**/*.html"],
  theme: {
    extend: {
      colors: {
        "grey-50": "#fafaf9",
        "grey-100": "#f5f5f4",
        "grey-200": "#e7e5e4",
        "grey-300": "#d6d3d1",
        "grey-400": "#a8a29e",
        "grey-500": "#78716c",
        "grey-600": "#57534e",
        "grey-700": "#44403c",
        "grey-800": "#292524",
        "grey-900": "#1c1917",
        "grey-950": "#0f0f0f",
        accent: "#ff2867",
        "accent-hover": "#e6245d",
        "accent-active": "#cc2050",
        success: "#059669",
        error: "#dc2626",
        warning: "#d97706",
      },
      fontFamily: {
        serif: ['"DM Serif Display"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Courier New"', "monospace"],
      },
    },
  },
  plugins: [require("daisyui"), require("@tailwindcss/typography")],
  daisyui: {
    themes: [
      {
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#ff2867",
          "primary-focus": "#e6245d",
          "primary-content": "#fafaf9",
          "base-100": "#1c1917",
          "base-200": "#292524",
          "base-300": "#0f0f0f",
          "base-content": "#fafaf9",
          neutral: "#292524",
          "neutral-content": "#fafaf9",
        },
      },
    ],
    logs: false,
  },
};
