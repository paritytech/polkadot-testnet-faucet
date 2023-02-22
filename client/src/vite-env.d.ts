/// <reference types="svelte" />
/// <reference types="vite/client" />

interface Captcha {
  ready: (callback: () => void) => void;
  execute: (key: string, input:  { action: 'submit' } ) => Promise<string>
}
