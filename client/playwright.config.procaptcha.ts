import type { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
  webServer: {
    command: "npm run build && npm run preview",
    port: 4173,
    env: {
      PUBLIC_CAPTCHA_PROVIDER: "procaptcha",
      PUBLIC_PROSOPO_SITE_KEY: "5HUBceb4Du6dvMA9BiwN5VzUrzUsX9Zp7z7nSR2cC1TCv5jg",
      PUBLIC_DEMO_MODE: "",
      PUBLIC_FAUCET_URL: "https://example.com/test",
    },
  },
  testDir: "tests",
};

export default config;
