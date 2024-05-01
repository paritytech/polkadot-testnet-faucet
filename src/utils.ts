import { config } from "src/config";
import { getNetworkData } from "src/networkData";
import { CaptchaProvider } from "src/types";

export function isAccountPrivileged(sender: string): boolean {
  const networkName = config.Get("NETWORK");
  const networkData = getNetworkData(networkName);

  return networkData.matrixWhitelistPatterns.some((pattern) => pattern.test(sender));
}

export const getCaptchaProvider = (provider: string): CaptchaProvider => {
  if (provider === CaptchaProvider.procaptcha) return CaptchaProvider.procaptcha;
  if (provider === CaptchaProvider.recaptcha) return CaptchaProvider.recaptcha;
  throw new Error(`⭕ - Invalid captcha provider: ${provider}`);
};
