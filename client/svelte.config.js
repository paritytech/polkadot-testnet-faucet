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
	}
};

export default config;
