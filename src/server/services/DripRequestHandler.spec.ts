import fs from "fs";

import { Actions } from "../services/Actions";
import ActionStorage from "../services/ActionStorage";
import { Recaptcha } from "../services/Recaptcha";
import { DripRequestHandler } from "./DripRequestHandler";

const actionsMock: Actions = {
  isAccountOverBalanceCap: async (addr: string) => addr === "rich",
  sendTokens: async (addr: string) =>
    addr === "unlucky" ? { error: "An error occurred when sending tokens" } : { hash: "0x123" },
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const recaptcha: Recaptcha = { validate: async (captcha: string) => captcha === "valid" } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

describe("DripRequestHandler", () => {
  let storage: ActionStorage;
  let storageFileName: string;
  let handler: DripRequestHandler;

  beforeEach(async () => {
    storageFileName = `./test-storage.db`;
    storage = new ActionStorage(storageFileName);
    await storage.isValid({ addr: "anyone, effectively awaiting sqlite initialization." });
    handler = new DripRequestHandler(actionsMock, storage, recaptcha);
  });

  afterEach(async () => {
    await fs.rmSync(storageFileName);
  });

  /**
   * Normal operation, the requests are coming from the matrix bot in a sibling docker container.
   */
  describe("Without external access", () => {
    const defaultRequest = {
      external: false,
      amount: "0.5",
      parachain_id: "1002",
      address: "123",
      sender: "someone",
    } as const;

    it("Goes through one time", async () => {
      {
        const result = await handler.handleRequest(defaultRequest);
        expect(result).toEqual({ hash: "0x123" });
      }
      {
        const result = await handler.handleRequest(defaultRequest);
        expect("error" in result).toBeTruthy();
      }
    });

    it("Returns an error response", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, address: "unlucky" });
      expect(result).toEqual({ error: "An error occurred when sending tokens" });
    });

    it("Doesn't allow a repeated address", async () => {
      await storage.saveData({ addr: defaultRequest.address });
      const result = await handler.handleRequest(defaultRequest);
      expect(result).toEqual({ error: "Requester has reached their daily quota. Only request once per day." });
    });

    it("Doesn't allow a repeated user", async () => {
      await storage.saveData({ username: defaultRequest.sender, addr: "other" });
      const result = await handler.handleRequest(defaultRequest);
      expect(result).toEqual({ error: "Requester has reached their daily quota. Only request once per day." });
    });

    it("Doesn't allow a rich address user", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, address: "rich" });
      expect(result).toEqual({ error: "Requester's balance is over the faucet's balance cap" });
    });

    it("Parity members are privileged in terms of repeated requests", async () => {
      await storage.saveData({ username: "someone:parity.io", addr: defaultRequest.address });
      const result = await handler.handleRequest({ ...defaultRequest, sender: "someone:parity.io" });
      expect(result).toEqual({ hash: "0x123" });
    });

    it("Parity members are privileged in terms of balance cap", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, sender: "someone:parity.io", address: "rich" });
      expect(result).toEqual({ hash: "0x123" });
    });
  });

  /**
   * The requests are coming from external requesters.
   */
  describe("With external access", () => {
    const defaultRequest = {
      external: true,
      amount: "0.5",
      parachain_id: "1002",
      address: "123",
      recaptcha: "valid",
    } as const;

    it("Goes through one time", async () => {
      {
        const result = await handler.handleRequest(defaultRequest);
        expect(result).toEqual({ hash: "0x123" });
      }
      {
        const result = await handler.handleRequest(defaultRequest);
        expect("error" in result).toBeTruthy();
      }
    });

    it("Returns an error response", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, address: "unlucky" });
      expect(result).toEqual({ error: "An error occurred when sending tokens" });
    });

    it("Doesn't allow a repeated address", async () => {
      await storage.saveData({ addr: defaultRequest.address });
      const result = await handler.handleRequest(defaultRequest);
      expect(result).toEqual({ error: "Requester has reached their daily quota. Only request once per day." });
    });

    it("Doesn't allow a rich address user", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, address: "rich" });
      expect(result).toEqual({ error: "Requester's balance is over the faucet's balance cap" });
    });

    it("Cannot repeat requests by (somehow) supplying Parity username", async () => {
      await storage.saveData({ username: "someone:parity.io", addr: defaultRequest.address });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await handler.handleRequest({ ...defaultRequest, sender: "someone:parity.io" } as any);
      expect(result).toEqual({ error: "Requester has reached their daily quota. Only request once per day." });
    });

    it("Cannot override balance cap by (somehow) supplying Parity username", async () => {
      const result = await handler.handleRequest({
        ...defaultRequest,
        sender: "someone:parity.io",
        address: "rich",
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(result).toEqual({ error: "Requester's balance is over the faucet's balance cap" });
    });

    it("Returns an error response if captcha is invalid", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, recaptcha: "invalid" });
      expect(result).toEqual({ error: "Captcha validation was unsuccessful" });
    });
  });
});
