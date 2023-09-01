// we need the mock methods to be before the imports for jest to run
/* eslint-disable import/first */

const mockHandleRequest = jest.fn();
const mockConfig = jest.fn();
const mockLoggerError = jest.fn();

import bodyParser from "body-parser";
import express, { Express } from "express";
import request from "supertest";

import { BotRequestType, FaucetRequestType } from "../../types";
import router from "./actions";

jest.mock("../../dripper/dripperStorage");
jest.mock("../../dripper/polkadot/PolkadotActions", () => {});
jest.mock("../../logger", () => {
  return { logger: { error: mockLoggerError } };
});

jest.mock("../../dripper/DripRequestHandler", () => {
  return {
    getDripRequestHandlerInstance: jest.fn().mockImplementation(() => {
      return { handleRequest: mockHandleRequest };
    }),
    DripRequestHandler: jest.fn().mockImplementation(() => {
      return { handleRequest: mockHandleRequest };
    }),
  };
});

const mockConfigValue: { config: Record<string, string | number | boolean> } = { config: {} };
jest.mock("../../config", () => {
  return {
    config: {
      Get: mockConfig.mockImplementation(
        (key: string) =>
          // eslint-disable-next-line security/detect-object-injection
          ({ NETWORK: "rococo" })[key], // minimal viable config on the initial import
      ),
    },
  };
});

let app: Express;

const parameterError = (parameter: keyof BotRequestType | keyof FaucetRequestType) =>
  `Missing parameter: '${parameter}'`;

describe("/drip/web tests", () => {
  beforeAll(() => {
    // eslint-disable-next-line security/detect-object-injection
    mockConfig.mockImplementation((key: string) => mockConfigValue.config[key]);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(bodyParser.json());
    const routers = express.Router();
    routers.use("/", router);
    app.use(router);

    mockConfigValue.config = {
      NETWORK: "rococo",
      FAUCET_ACCOUNT_MNEMONIC:
        "scrub inquiry adapt lounge voice current manage chief build shoot drip liar head season inside",
    };
  });

  test("should fail with no address", async () => {
    const res = await request(app).post("/drip/web");
    expect(res.body.error).toBe(parameterError("address"));
    expect(res.status).toBe(400);
  });

  test("should fail with no captcha", async () => {
    const res = await request(app).post("/drip/web").send({ address: "example" });
    expect(res.body.error).toBe(parameterError("recaptcha"));
    expect(res.status).toBe(400);
  });

  test("should request drip", async () => {
    mockHandleRequest.mockImplementation(() => {
      return {};
    });

    const res = await request(app).post("/drip/web").send({ address: "example1", recaptcha: "captcha1" });
    expect(mockHandleRequest).toHaveBeenCalledWith(
      expect.objectContaining({ external: true, address: "example1", recaptcha: "captcha1" }),
    );
    expect(res.status).toBe(200);
  });

  test("should report error on error drip result", async () => {
    const error = "this is an error";
    mockHandleRequest.mockImplementation(() => {
      return { error };
    });

    const res = await request(app).post("/drip/web").send({ address: "example2", recaptcha: "captcha2" });
    expect(mockHandleRequest).toHaveBeenCalledWith(
      expect.objectContaining({ external: true, address: "example2", recaptcha: "captcha2" }),
    );
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(error);
  });

  test("should report error on internal error", async () => {
    mockHandleRequest.mockRejectedValueOnce("random error in /web");
    const res = await request(app).post("/drip/web").send({ address: "example3", recaptcha: "captcha3" });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Operation failed.");
    expect(mockLoggerError).toHaveBeenCalledWith("random error in /web");
  });
});
