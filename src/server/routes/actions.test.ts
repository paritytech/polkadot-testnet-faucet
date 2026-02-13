import * as mockedDripperStorage from "#src/dripper/__mocks__/dripperStorage";
import { expectHaveBeenCalledWith, mockRejectedValueOnce, mockResolvedValueOnce } from "#src/test/mockHelpers";
import { BotRequestType, DripResponse, FaucetRequestType } from "#src/types";
import bodyParser from "body-parser";
import { expect } from "earl";
import express, { Express } from "express";
import { beforeEach, describe, mock, test } from "node:test";
import request from "supertest";

mock.module("#src/dripper/__mocks__/dripperStorage", { namedExports: mockedDripperStorage });
mock.module("#src/dripper/polkadot/PolkadotActions", { defaultExport: null });

const mockLoggerError = mock.fn();
mock.module("#src/logger", { namedExports: { logger: { error: mockLoggerError, debug: mock.fn() } } });
const mockHandleRequest = mock.fn<(...args: unknown[]) => Promise<DripResponse>>(() =>
  Promise.resolve({ hash: "0x123" }),
);

mock.module("#src/dripper/DripRequestHandler", {
  namedExports: {
    getDripRequestHandlerInstance: mock.fn(() => {
      return {
        handleRequest: mockHandleRequest,
      };
    }),
    DripRequestHandler: mock.fn(() => {
      return {
        handleRequest: mockHandleRequest,
      };
    }),
  },
});

let app: Express;

const parameterError = (parameter: keyof BotRequestType | keyof FaucetRequestType) =>
  `Missing parameter: '${parameter}'`;

const parseNdjson = (text: string): unknown[] =>
  text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as unknown);

describe("/drip/web tests", () => {
  beforeEach(async () => {
    app = express();
    app.use(bodyParser.json());
    const router: express.Router = (await import("./actions.js")).default;
    app.use(router);

    process.env.SMF_CONFIG_NETWORK = "paseo";
  });

  test("should fail with no address", async () => {
    const res = await request(app).post("/drip/web");
    expect(res.body.error).toEqual(parameterError("address"));
    expect(res.status).toEqual(400);
  });

  test("should fail with no captcha", async () => {
    const res = await request(app).post("/drip/web").send({ address: "example" });
    expect(res.body.error).toEqual(parameterError("recaptcha"));
    expect(res.status).toEqual(400);
  });

  test("should request drip", async () => {
    mockHandleRequest.mock.resetCalls();
    const res = await request(app).post("/drip/web").send({ address: "example1", recaptcha: "captcha1" });
    expect(res.status).toEqual(200);
    const lines = parseNdjson(res.text);
    const lastLine = lines[lines.length - 1] as Record<string, unknown>;
    expect(lastLine).toEqual(expect.subset({ hash: "0x123" }));
    // Verify handleRequest was called with correct opts (first arg)
    expect(mockHandleRequest.mock.calls.length).toBeGreaterThan(0);
    const callArgs = mockHandleRequest.mock.calls[0].arguments;
    expect(callArgs[0]).toEqual(expect.subset({ external: true, address: "example1", recaptcha: "captcha1" }));
  });

  test("should report error on error drip result", async () => {
    const error = "this is an error";
    mockResolvedValueOnce(mockHandleRequest, { error });

    const res = await request(app).post("/drip/web").send({ address: "example2", recaptcha: "captcha2" });
    expect(res.status).toEqual(200);
    const lines = parseNdjson(res.text);
    const lastLine = lines[lines.length - 1] as Record<string, unknown>;
    expect(lastLine).toEqual(expect.subset({ error }));
    expect(mockHandleRequest.mock.calls.length).toBeGreaterThan(0);
    const callArgs = mockHandleRequest.mock.calls[mockHandleRequest.mock.calls.length - 1].arguments;
    expect(callArgs[0]).toEqual(expect.subset({ external: true, address: "example2", recaptcha: "captcha2" }));
  });

  test("should report error on internal error", async () => {
    mockRejectedValueOnce(mockHandleRequest, "random error in /web");
    const res = await request(app).post("/drip/web").send({ address: "example3", recaptcha: "captcha3" });
    expect(res.status).toEqual(200);
    const lines = parseNdjson(res.text);
    const lastLine = lines[lines.length - 1] as Record<string, unknown>;
    expect(lastLine).toEqual(expect.subset({ error: "Operation failed." }));
    expectHaveBeenCalledWith(mockLoggerError, ["random error in /web"]);
  });
});
