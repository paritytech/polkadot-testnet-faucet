import nodeAdapter from "@sveltejs/adapter-node";
import staticAdapter from "@sveltejs/adapter-static";
import {sveltePreprocess} from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */

const config = {
  preprocess: sveltePreprocess({ postcss: true }),

  kit: {
    adapter: process.env.STATIC ? staticAdapter() : nodeAdapter(),
    paths: { base: process.env.BASE ?? "", relative: !process.env.BASE },
  },
};

export default config;
