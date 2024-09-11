import nodeAdapter from "@sveltejs/adapter-node";
import staticAdapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */

const config = {
  preprocess: [preprocess({ postcss: true })],
  onwarn: (warning, handler) => {
    if (warning.code === 'css-unused-selector') {
      return;
    }
    handler(warning);
  },

  kit: {
    adapter: process.env.STATIC ? staticAdapter() : nodeAdapter(),
    paths: { base: process.env.BASE ?? "", relative: !process.env.BASE },
  },
};

export default config;
