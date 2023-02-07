import { OAuth2Client } from "google-auth-library";

import { logger } from "../../logger";
import { config } from "../config";
import errorCounter from "./ErrorCounter";

export class GoogleAuth {
  private authClient: OAuth2Client;
  constructor(
    private clientId: string = config.Get("GOOGLE_AUTH_CLIENT_ID"),
    clientSecret: string = config.Get("GOOGLE_AUTH_CLIENT_SECRET"),
  ) {
    if (config.Get("EXTERNAL_ACCESS") && !clientId) {
      throw new Error(`⭕ Google Auth is not configured. Check the GOOGLE_AUTH_CLIENT_ID variable.`);
    }
    if (config.Get("EXTERNAL_ACCESS") && !clientSecret) {
      throw new Error(`⭕ Google Auth is not configured. Check the GOOGLE_AUTH_CLIENT_SECRET variable.`);
    }
    this.authClient = new OAuth2Client({ clientSecret, clientId });
  }

  /**
   *
   * @returns An authenticated user email, or null if authentication was not successful.
   */
  async validate(google_auth_token: string): Promise<string | null> {
    try {
      const result = await this.authClient.verifyIdToken({ idToken: google_auth_token, audience: this.clientId });
      const payload = result.getPayload();
      if (!payload?.email_verified) return null;
      return payload.email ?? null;
    } catch (e) {
      logger.error(`⭕ An error occurred when validating google auth token`, e);
      errorCounter.plusOne("other");
      return null;
    }
  }
}
