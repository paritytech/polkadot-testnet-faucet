import nodeAdapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
		preprocess({
		  postcss: true,
		}),
	  ],

	kit: {
		adapter: process.env.STATIC ? staticAdapter() : nodeAdapter(),
		paths: {
			base: process.env.GITHUB_PAGES ? process.env.GITHUB_PAGES : "",
		}
	}
};

export default config;
