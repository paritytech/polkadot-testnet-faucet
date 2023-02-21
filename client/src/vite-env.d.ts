/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Captcha {
  render: (element: string, key: { sitekey: string, callback?: string, 'expired-callback'?: string, theme?: 'light' | 'dark', size?: 'normal' | 'compact' }) => void;
  getResponse: () => string;
}

interface Window {
  grecaptcha?: Captcha;
  captchaLoaded: () => void;
  onToken: (token: string) => void;
  onExpiredToken: () => void;
}
