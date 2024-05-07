import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  webServer: {
    command: "npm run build && npm run preview",
    port: 4173,
    env: {
      PUBLIC_CAPTCHA_PROVIDER: "recaptcha",
      PUBLIC_RECAPTCHA_KEY: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
      PUBLIC_DEMO_MODE: "",
      PUBLIC_FAUCET_URL: "https://example.com/test",
    },
  },

  testDir: "tests",
};

export default config;
