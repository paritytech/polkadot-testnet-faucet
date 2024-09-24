import axios from "axios";
import { URLSearchParams } from "url";

import { config } from "../config";
import { logger } from "../logger";

export class Captcha {
  constructor(private secret: string = config.Get("CAPTCHA_SECRET")) {
    if (!this.secret) {
      throw new Error(`⭕ HCaptcha is not configured. Check the CAPTCHA_SECRET variable.`);
    }
  }

  async validate(captcha: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append("secret", this.secret);
      params.append("response", captcha);
      const captchaResult = await axios.post("https://api.hcaptcha.com/siteverify", params);
      if (captchaResult.data.success === true) return true;
      logger.debug("❌Negative captcha validation result", captchaResult.data);
      return false;
    } catch (e) {
      logger.error(`⭕ An error occurred when validating captcha`, e);
      return false;
    }
  }
}
