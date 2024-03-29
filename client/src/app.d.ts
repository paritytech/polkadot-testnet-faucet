// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}

	declare interface Window {
		grecaptcha?: Captcha;
		captchaLoaded: () => void;
		onToken: (token: string) => void;
		onExpiredToken: () => void;
	}
}

interface Captcha {
	render: (
		element: string,
		key: {
			sitekey: string;
			callback?: string;
			"expired-callback"?: string;
			theme?: "light" | "dark";
			size?: "normal" | "compact";
		}
	) => void;
	getResponse: () => string;
}

export {};
