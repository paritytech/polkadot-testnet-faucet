import { sveltekit } from "@sveltejs/kit/vite";
import path from "path";
import { defineConfig } from "vite";

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      "@polkadot-api/descriptors": path.resolve(__dirname, "../.papi/descriptors"),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "../.papi/descriptors")],
    },
  },
});
