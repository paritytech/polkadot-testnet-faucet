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
    grecaptcha?: Recaptcha;
    procaptcha?: Procaptcha;
    captchaLoaded: () => void;
    onToken: (token: string) => void;
    onExpiredToken: () => void;
  }
}
interface Recaptcha {
  render: (
    element: string,
    key: {
      sitekey: string;
      callback?: string;
      "expired-callback"?: string;
      theme?: "light" | "dark";
      size?: "normal" | "compact";
    },
  ) => void;
  getResponse: () => string;
}

interface Procaptcha {
  render: (
    element: string,
    key: {
      siteKey: string;
      callback?: string;
      theme?: "light" | "dark";
      "chalexpired-callback"?: string;
    },
  ) => void;
  default: (callback: () => void) => void;
}

export {};
