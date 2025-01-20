import { expectHaveBeenCalledWith, mockResolvedValueOnce } from "#src/test/mockHelpers";
import { expect } from "earl";
import { beforeEach, describe, it, mock } from "node:test";

import * as mockedDripperStorage from "./__mocks__/dripperStorage.js";
import type { PolkadotActions } from "./polkadot/PolkadotActions.js";
import { convertAmountToBn } from "./polkadot/utils.js";
import type { Recaptcha } from "./Recaptcha.js";

mock.module("./dripperStorage.js", { namedExports: mockedDripperStorage });

const actionsMock: PolkadotActions = {
  isAccountOverBalanceCap: async (addr: string) => addr === "rich",
  sendTokens: async (addr: string) =>
    addr === "unlucky" ? { error: "An error occurred when sending tokens" } : { hash: "0x123" },
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const recaptcha: Recaptcha = { validate: async (captcha: string) => captcha === "valid" } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const getHandler = async () => new (await import("./DripRequestHandler.js")).DripRequestHandler(actionsMock, recaptcha);

describe("DripRequestHandler", async () => {
  beforeEach(async () => {
    mockedDripperStorage.hasDrippedToday.mock.resetCalls();
    mockedDripperStorage.saveDrip.mock.resetCalls();
  });

  /**
   * Normal operation, the requests are coming from the matrix bot in a sibling docker container.
   */
  describe("Without external access", () => {
    const defaultRequest = {
      external: false,
      amount: convertAmountToBn("0.5"),
      parachain_id: "1002",
      address: "123",
      sender: "someone",
    } as const;

    it("Goes through one time", async () => {
      const handler = await getHandler();
      {
        const result = await handler.handleRequest(defaultRequest);

        expectHaveBeenCalledWith(mockedDripperStorage.saveDrip, [{ addr: "123", username: "someone" }]);
        expect(result).toEqual({ hash: "0x123" });
      }
      {
        mockResolvedValueOnce(mockedDripperStorage.hasDrippedToday, true);

        const result = await handler.handleRequest(defaultRequest);
        expect("error" in result).toBeTruthy();
      }
    });

    it("Returns an error response", async () => {
      const handler = await getHandler();
      const result = await handler.handleRequest({ ...defaultRequest, address: "unlucky" });
      expect(result).toEqual({ error: "An error occurred when sending tokens" });
    });

    it("Doesn't allow a repeated address or username", async () => {
      const handler = await getHandler();
      mockResolvedValueOnce(mockedDripperStorage.hasDrippedToday, true);

      const result = await handler.handleRequest(defaultRequest);
      expectHaveBeenCalledWith(mockedDripperStorage.hasDrippedToday, [{ addr: "123", username: "someone" }]);
      expect(result).toEqual({ error: "Requester has reached their daily quota. Only request once per day." });
    });

    it("Doesn't allow a rich address user", async () => {
      const handler = await getHandler();
      const result = await handler.handleRequest({ ...defaultRequest, address: "rich" });
      expect(result).toEqual({ error: "Requester's balance is over the faucet's balance cap" });
    });

    it("Parity members are privileged in terms of repeated requests", async () => {
      const handler = await getHandler();
      mockResolvedValueOnce(mockedDripperStorage.hasDrippedToday, true);

      const result = await handler.handleRequest({ ...defaultRequest, sender: "someone:parity.io" });
      expect(result).toEqual({ hash: "0x123" });
    });

    it("Parity members are privileged in terms of balance cap", async () => {
      const handler = await getHandler();
      const result = await handler.handleRequest({ ...defaultRequest, sender: "someone:parity.io", address: "rich" });
      expect(result).toEqual({ hash: "0x123" });
    });

    it("Works with empty parachain_id", async () => {
      const handler = await getHandler();
      const result = await handler.handleRequest({ ...defaultRequest, parachain_id: "" });
      expect(result).toEqual({ hash: "0x123" });
    });
  });

  /**
   * The requests are coming from external requesters.
   */
  describe("With external access", () => {
    const defaultRequest = {
      external: true,
      amount: convertAmountToBn("0.5"),
      parachain_id: "1002",
      address: "123",
      recaptcha: "valid",
    } as const;

    it("Goes through one time", async () => {
      const handler = await getHandler();
      {
        const result = await handler.handleRequest(defaultRequest);
        expectHaveBeenCalledWith(mockedDripperStorage.saveDrip, [{ addr: "123" }]);
        expect(result).toEqual({ hash: "0x123" });
      }
      {
        mockResolvedValueOnce(mockedDripperStorage.hasDrippedToday, true);
        const result = await handler.handleRequest(defaultRequest);
        expect("error" in result).toBeTruthy();
      }
    });

    it("Returns an error response", async () => {
      const handler = await getHandler();
      const result = await handler.handleRequest({ ...defaultRequest, address: "unlucky" });
      expect(result).toEqual({ error: "An error occurred when sending tokens" });
    });

    it("Doesn't allow a repeated address", async () => {
      const handler = await getHandler();
      mockResolvedValueOnce(mockedDripperStorage.hasDrippedToday, true);
      const result = await handler.handleRequest(defaultRequest);
      expect(result).toEqual({ error: "Requester has reached their daily quota. Only request once per day." });
    });

    it("Doesn't allow a rich address user", async () => {
      const handler = await getHandler();
      const result = await handler.handleRequest({ ...defaultRequest, address: "rich" });
      expect(result).toEqual({ error: "Requester's balance is over the faucet's balance cap" });
    });

    it("Cannot repeat requests by (somehow) supplying Parity username", async () => {
      const handler = await getHandler();
      mockResolvedValueOnce(mockedDripperStorage.hasDrippedToday, true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await handler.handleRequest({ ...defaultRequest, sender: "someone:parity.io" } as any);
      expect(result).toEqual({ error: "Requester has reached their daily quota. Only request once per day." });
    });

    it("Cannot override balance cap by (somehow) supplying Parity username", async () => {
      const handler = await getHandler();
      const result = await handler.handleRequest({
        ...defaultRequest,
        sender: "someone:parity.io",
        address: "rich",
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(result).toEqual({ error: "Requester's balance is over the faucet's balance cap" });
    });

    it("Returns an error response if captcha is invalid", async () => {
      const handler = await getHandler();
      const result = await handler.handleRequest({ ...defaultRequest, recaptcha: "invalid" });
      expect(result).toEqual({ error: "Captcha validation was unsuccessful" });
    });

    it("Works with empty parachain_id", async () => {
      const handler = await getHandler();
      const result = await handler.handleRequest({ ...defaultRequest, parachain_id: "" });
      expect(result).toEqual({ hash: "0x123" });
    });
  });
});
