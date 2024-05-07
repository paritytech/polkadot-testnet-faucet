import { getPair } from "@prosopo/contract";
import { getServerConfig, ProsopoServer } from "@prosopo/server";
import { ProcaptchaOutput, ProcaptchaOutputSchema } from "@prosopo/types";

import { config } from "src/config";

import { logger } from "../logger";

const DEFAULT_PROCAPTCHA_MAX_VERIFIED_TIME = 60000;

export class Procaptcha {
  constructor(
    private secret: string = config.Get("PROSOPO_SITE_KEY"),
    private contractAddress: string | undefined = config.Get("PROSOPO_CONTRACT_ADDRESS"),
    private readonly endpoint: string | undefined = config.Get("PROSOPO_SUBSTRATE_ENDPOINT"),
    private readonly maxVerifiedTime: number = DEFAULT_PROCAPTCHA_MAX_VERIFIED_TIME,
  ) {
    if (!this.secret) {
      throw new Error(`⭕ Procaptcha is not configured. Check the PROSOPO_SITE_KEY variable.`);
    }
  }

  getValidator() {
    const serverConfig = getServerConfig();
    serverConfig.dappName = "rococoFaucet";
    serverConfig.account.address = this.secret;
    if (this.endpoint) {
      // set the endpoint to any other contracts network, e.g. a local node for testing
      serverConfig.networks.rococo.endpoint = this.endpoint;
    }
    if (this.contractAddress) {
      // contract needs to be deployed for this to work
      serverConfig.networks.rococo.contract.address = this.contractAddress;
    }
    const pair = getPair(serverConfig.networks.rococo, undefined, this.secret);
    return new ProsopoServer(serverConfig, pair);
  }

  private parseOutput(captcha: string): ProcaptchaOutput {
    return ProcaptchaOutputSchema.parse(JSON.parse(captcha));
  }

  async validate(captcha: string, maxVerifiedTime?: number): Promise<boolean> {
    try {
      const prosopoOutput = this.parseOutput(captcha);
      const prosopoServer = this.getValidator();
      await prosopoServer.isReady();
      return await prosopoServer.isVerified(prosopoOutput, maxVerifiedTime || this.maxVerifiedTime);
    } catch (e) {
      logger.error(`⭕ An error occurred when validating captcha`, e);
      return false;
    }
  }
}
