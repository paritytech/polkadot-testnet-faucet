import { expect } from "earl";
import { describe, it } from "node:test";

import { Recaptcha } from "./Recaptcha.js";

const PUBLIC_TESTING_RECAPTCHA_SECRET_KEY = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";
const OTHER_SECRET_KEY = "AAAAAAAAAAAAAAA-AAAAAAAAAAAAAAAAAAAAAAAA";

describe("Recaptcha", () => {
  it("Validates captcha positively", async () => {
    const recaptcha = new Recaptcha(PUBLIC_TESTING_RECAPTCHA_SECRET_KEY);
    const result = await recaptcha.validate("something");
    expect(result).toBeTruthy();
  });

  it("Validates captcha negatively", async () => {
    const recaptcha = new Recaptcha(OTHER_SECRET_KEY);
    const result = await recaptcha.validate("something");
    expect(result).toBeFalsy();
  });
});
