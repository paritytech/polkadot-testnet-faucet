import { ApiPaths, ProcaptchaOutput } from "@prosopo/types";
import axios from "axios";

import { Procaptcha } from "./Procaptcha";

// Alice's address
const PROCAPTCHA_VALID_CAPTCHA = `{
  "user": "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  "dapp": "5HUBceb4Du6dvMA9BiwN5VzUrzUsX9Zp7z7nSR2cC1TCv5jg",
  "providerUrl": "https://mockprovider.prosopo.io/",
  "blockNumber": 3604097
}`;

// Bob's address
const PROCAPTCHA_INVALID_CAPTCHA = `{
  "user": "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  "dapp": "5HUBceb4Du6dvMA9BiwN5VzUrzUsX9Zp7z7nSR2cC1TCv5jg",
  "providerUrl": "https://mockprovider.prosopo.io/",
  "blockNumber": 0
}`;

const PROSOPO_SITE_KEY = "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM";

// This is a mock of the @prosopo/server function isVerified that prevents calling out to a contract. A call to a test
// provider API is still made.
const mockValidationFn = async (payload: ProcaptchaOutput) => {
  const { dapp, user, providerUrl, commitmentId, blockNumber } = payload;
  if (!providerUrl) {
    throw new Error("No providerUrl provided");
  }
  const params = { dapp, user, commitmentId, blockNumber };
  const url = new URL(ApiPaths.VerifyCaptchaSolution, providerUrl).href;
  const result = await axios.post(url, params);
  return result.data.verified;
};

describe("Prosopo Procaptcha", () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    jest.spyOn(Procaptcha.prototype, "getValidator").mockImplementation(() => {
      return { isVerified: mockValidationFn, isReady: () => true };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("Validates captcha positively", async () => {
    const procaptcha = new Procaptcha(PROSOPO_SITE_KEY);
    const result = await procaptcha.validate(PROCAPTCHA_VALID_CAPTCHA);
    expect(result).toBeTruthy();
  });

  it("Validates captcha negatively", async () => {
    const procaptcha = new Procaptcha(PROSOPO_SITE_KEY);
    const result = await procaptcha.validate(PROCAPTCHA_INVALID_CAPTCHA);
    expect(result).toBeFalsy();
  });
});
