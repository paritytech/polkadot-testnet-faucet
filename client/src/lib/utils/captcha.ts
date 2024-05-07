export enum CaptchaProvider {
  procaptcha = "procaptcha",
  recaptcha = "recaptcha",
}

export const getCaptchaProvider = (provider: string): CaptchaProvider => {
  if (provider === CaptchaProvider.procaptcha) return CaptchaProvider.procaptcha;
  if (provider === CaptchaProvider.recaptcha) return CaptchaProvider.recaptcha;
  throw new Error(`⭕ - Invalid captcha provider: ${provider}`);
};
