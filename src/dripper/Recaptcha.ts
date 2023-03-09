import axios from "axios";
import { URLSearchParams } from "url";

import errorCounter from "../common/ErrorCounter";
import { serverConfig } from "../config";
import { logger } from "../logger";

export class Recaptcha {
  constructor(private secret: string = serverConfig.Get("RECAPTCHA_SECRET")) {
    if (serverConfig.Get("EXTERNAL_ACCESS") && !this.secret) {
      throw new Error(`⭕ Recaptcha is not configured. Check the RECAPTCHA_SECRET variable.`);
    }
  }

  async validate(captcha: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append("secret", this.secret);
      params.append("response", captcha);
      const captchaResult = await axios.post("https://www.google.com/recaptcha/api/siteverify", params);
      if (captchaResult.data.success === true) return true;
      logger.debug("Negative recaptcha validation result", captchaResult.data);
      return false;
    } catch (e) {
      logger.error(`⭕ An error occurred when validating captcha`, e);
      errorCounter.plusOne("other");
      return false;
    }
  }
}
