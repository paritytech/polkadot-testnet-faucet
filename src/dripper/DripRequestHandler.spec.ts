import type { Captcha } from "./Captcha";
import { hasDrippedToday, saveDrip } from "./dripperStorage";
import { DripRequestHandler } from "./DripRequestHandler";
import type { PolkadotActions } from "./polkadot/PolkadotActions";
import { convertAmountToBn } from "./polkadot/utils";

jest.mock("./dripperStorage");

const actionsMock: PolkadotActions = {
  isAccountOverBalanceCap: async (addr: string) => addr === "rich",
  sendTokens: async (addr: string) =>
    addr === "unlucky" ? { error: "An error occurred when sending tokens" } : { hash: "0x123" },
} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const captcha: Captcha = { validate: async (cap: string) => cap === "valid" } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

function assumeMocked<R, A extends unknown[]>(f: (...args: A) => R): jest.Mock<R, A> {
  return f as jest.Mock<R, A>;
}

describe("DripRequestHandler", () => {
  let handler: DripRequestHandler;

  beforeEach(async () => {
    handler = new DripRequestHandler(actionsMock, captcha);
    jest.clearAllMocks();
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
      {
        const result = await handler.handleRequest(defaultRequest);
        expect(assumeMocked(saveDrip)).toHaveBeenCalledWith({ addr: "123", username: "someone" });
        expect(result).toEqual({ hash: "0x123" });
      }
      {
        assumeMocked(hasDrippedToday).mockResolvedValueOnce(true);
        const result = await handler.handleRequest(defaultRequest);
        expect("error" in result).toBeTruthy();
      }
    });

    it("Returns an error response", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, address: "unlucky" });
      expect(result).toEqual({ error: "An error occurred when sending tokens" });
    });

    it("Doesn't allow a repeated address or username", async () => {
      assumeMocked(hasDrippedToday).mockResolvedValueOnce(true);
      const result = await handler.handleRequest(defaultRequest);
      expect(hasDrippedToday).toHaveBeenCalledWith({ addr: "123", username: "someone" });
      expect(result).toEqual({ error: "Requester has reached their daily quota. Only request once per day." });
    });

    it("Doesn't allow a rich address user", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, address: "rich" });
      expect(result).toEqual({ error: "Requester's balance is over the faucet's balance cap" });
    });

    it("Parity members are privileged in terms of repeated requests", async () => {
      assumeMocked(hasDrippedToday).mockResolvedValueOnce(true);
      const result = await handler.handleRequest({ ...defaultRequest, sender: "@erin:parity.io" });
      expect(result).toEqual({ hash: "0x123" });
    });

    it("Parity members are privileged in terms of balance cap", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, sender: "@pierre:parity.io", address: "rich" });
      expect(result).toEqual({ hash: "0x123" });
    });

    it("Works with empty parachain_id", async () => {
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
      captcha: "valid",
    } as const;

    it("Goes through one time", async () => {
      {
        const result = await handler.handleRequest(defaultRequest);
        expect(assumeMocked(saveDrip)).toHaveBeenCalledWith({ addr: "123" });
        expect(result).toEqual({ hash: "0x123" });
      }
      {
        assumeMocked(hasDrippedToday).mockResolvedValueOnce(true);
        const result = await handler.handleRequest(defaultRequest);
        expect("error" in result).toBeTruthy();
      }
    });

    it("Returns an error response", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, address: "unlucky" });
      expect(result).toEqual({ error: "An error occurred when sending tokens" });
    });

    it("Doesn't allow a repeated address", async () => {
      assumeMocked(hasDrippedToday).mockResolvedValueOnce(true);
      const result = await handler.handleRequest(defaultRequest);
      expect(result).toEqual({ error: "Requester has reached their daily quota. Only request once per day." });
    });

    it("Doesn't allow a rich address user", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, address: "rich" });
      expect(result).toEqual({ error: "Requester's balance is over the faucet's balance cap" });
    });

    it("Cannot repeat requests by (somehow) supplying Parity username", async () => {
      assumeMocked(hasDrippedToday).mockResolvedValueOnce(true);
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
      const result = await handler.handleRequest({ ...defaultRequest, captcha: "invalid" });
      expect(result).toEqual({ error: "Captcha validation was unsuccessful" });
    });

    it("Works with empty parachain_id", async () => {
      const result = await handler.handleRequest({ ...defaultRequest, parachain_id: "" });
      expect(result).toEqual({ hash: "0x123" });
    });
  });
});
