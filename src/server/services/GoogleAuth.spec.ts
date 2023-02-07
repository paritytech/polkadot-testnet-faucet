import { GoogleAuth } from "./GoogleAuth";

const validButExpiredAccessToken = "";
const validToken = "";
const clientId = "";

/**
 * These tests are skipped because they rely on secret values - google auth secret key,
 * and user authentication tokens.
 * To be uncommented when developing the GoogleAuth implementation.
 */

describe.skip("GoogleAuth", () => {
  it("valid but expired", async () => {
    const googleAuth = new GoogleAuth(clientId, process.env.GOOGLE_AUTH_CLIENT_SECRET as string);
    const result = await googleAuth.validate(validButExpiredAccessToken);
    expect(result).toBeFalsy();
  });

  it("valid", async () => {
    const googleAuth = new GoogleAuth(clientId, process.env.GOOGLE_AUTH_CLIENT_SECRET as string);
    const result = await googleAuth.validate(validToken);
    expect(result).toBeTruthy();
  });
});
