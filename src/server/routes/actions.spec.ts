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

jest.mock("../services/ActionStorage");
jest.mock("../services/Actions", () => {});
jest.mock("../../logger", () => {
  return { logger: { error: mockLoggerError } };
});

jest.mock("../services/DripRequestHandler", () => {
  return {
    DripRequestHandler: jest.fn().mockImplementation(() => {
      return { handleRequest: mockHandleRequest };
    }),
  };
});
jest.mock("../config", () => {
  return {
    config: {
      Get: mockConfig.mockImplementation((type: string) => {
        switch (type) {
          case "RPC_ENDPOINT":
            return "http://localhost";
          case "INJECTED_TYPES":
            return "{}";
          case "FAUCET_ACCOUNT_MNEMONIC":
            // random seed phrase
            return "scrub inquiry adapt lounge voice current manage chief build shoot drip liar head season inside";
          default:
            return "generic";
        }
      }),
    },
  };
});

let app: Express;

const parameterError = (parameter: keyof BotRequestType | keyof FaucetRequestType) =>
  `Missing parameter: '${parameter}'`;

describe("/drip/* tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    app = express();
    app.use(bodyParser.json());
    const routers = express.Router();
    routers.use("/", router);
    app.use(router);
  });

  describe("/drip/web", () => {
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
      expect(res.status).toBe(500);
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

  describe("/drip/bot", () => {
    beforeEach(() => {
      mockConfig.mockImplementation((type: string) => {
        if (type === "EXTERNAL_ACCESS") {
          return false;
        }
        return "generic";
      });
    });

    test("should fail with no address", async () => {
      const res = await request(app).post("/drip/bot");
      expect(res.body.error).toBe(parameterError("address"));
      expect(res.status).toBe(400);
    });

    test("should fail if external access is enabled", async () => {
      mockConfig.mockImplementation((type: string) => {
        if (type === "EXTERNAL_ACCESS") {
          return true;
        }
        return "generic";
      });

      const res = await request(app).post("/drip/bot").send({ address: "example" });
      expect(res.body.error).toBe("Endpoint unavailable");
      expect(res.status).toBe(503);
    });

    test("should fail with no amount", async () => {
      const res = await request(app).post("/drip/bot").send({ address: "example" });
      expect(res.body.error).toBe(parameterError("amount"));
      expect(res.status).toBe(400);
    });

    test("should fail with no sender", async () => {
      const res = await request(app).post("/drip/bot").send({ address: "example", amount: "100" });
      expect(res.body.error).toBe(parameterError("sender"));
      expect(res.status).toBe(400);
    });

    test("should fail with no sender", async () => {
      const res = await request(app).post("/drip/bot").send({ address: "example1", amount: "100", sender: "sender1" });
      expect(res.status).toBe(200);
      expect(mockHandleRequest).toHaveBeenCalledWith(
        expect.objectContaining({ external: false, address: "example1", amount: "100", sender: "sender1" }),
      );
    });

    test("should report error on internal error", async () => {
      mockHandleRequest.mockRejectedValueOnce("random error in /bot");
      const res = await request(app).post("/drip/bot").send({ address: "example", amount: "0", sender: "sender" });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Operation failed.");
      expect(mockLoggerError).toHaveBeenCalledWith("random error in /bot");
    });
  });
});

describe("/drip tests", () => {
  beforeEach(() => {
    jest.resetAllMocks();

    app = express();
    app.use(bodyParser.json());
    const routers = express.Router();
    routers.use("/", router);
    app.use(router);
  });

  test("should fail with no address", async () => {
    const res = await request(app).post("/drip");
    expect(res.body.error).toBe(parameterError("address"));
  });

  describe("web endpoints", () => {
    beforeEach(() => {
      mockConfig.mockImplementation((type: string) => {
        if (type === "EXTERNAL_ACCESS") {
          return true;
        }
        return "generic";
      });
    });

    test("should fail with no captcha", async () => {
      const res = await request(app).post("/drip").send({ address: "example" });
      expect(res.body.error).toBe(parameterError("recaptcha"));
    });

    test("should request drip", async () => {
      mockHandleRequest.mockImplementation(() => {
        return {};
      });

      const res = await request(app).post("/drip").send({ address: "example1", recaptcha: "captcha1" });
      expect(mockHandleRequest).toHaveBeenCalledWith(
        expect.objectContaining({ external: true, address: "example1", recaptcha: "captcha1" }),
      );
      expect(res.status).toBe(200);
    });

    test("should report error on error drip result", async () => {
      const error = "this is an error in web";
      mockHandleRequest.mockImplementation(() => {
        return { error };
      });

      const res = await request(app).post("/drip").send({ address: "example2", recaptcha: "captcha2" });
      expect(mockHandleRequest).toHaveBeenCalledWith(
        expect.objectContaining({ external: true, address: "example2", recaptcha: "captcha2" }),
      );
      expect(res.body.error).toBe(error);
    });

    test("should report error on internal error", async () => {
      mockHandleRequest.mockRejectedValueOnce("random error in web");
      const res = await request(app).post("/drip").send({ address: "example3", recaptcha: "captcha3" });
      expect(res.body.error).toBe("Operation failed.");
      expect(res.status).toBe(400);
      expect(mockLoggerError).toHaveBeenCalledWith("random error in web");
    });
  });

  describe("bot endpoints", () => {
    beforeEach(() => {
      mockConfig.mockImplementation((type: string) => {
        if (type === "EXTERNAL_ACCESS") {
          return false;
        }
        return "generic";
      });
    });

    test("should fail with no address", async () => {
      const res = await request(app).post("/drip");
      expect(res.body.error).toBe(parameterError("address"));
      expect(res.status).toBe(400);
    });

    test("should fail with no amount", async () => {
      const res = await request(app).post("/drip").send({ address: "example" });
      expect(res.body.error).toBe(parameterError("amount"));
      expect(res.status).toBe(400);
    });

    test("should fail with no sender", async () => {
      const res = await request(app).post("/drip").send({ address: "example", amount: "100" });
      expect(res.body.error).toBe(parameterError("sender"));
      expect(res.status).toBe(400);
    });

    test("should fail with no sender", async () => {
      const res = await request(app).post("/drip").send({ address: "example1", amount: "100", sender: "sender1" });
      expect(res.status).toBe(200);
      expect(mockHandleRequest).toHaveBeenCalledWith(
        expect.objectContaining({ external: false, address: "example1", amount: "100", sender: "sender1" }),
      );
    });

    test("should report error on internal error", async () => {
      mockHandleRequest.mockRejectedValueOnce("random error in bot endpoint");
      const res = await request(app).post("/drip").send({ address: "example", amount: "0", sender: "sender" });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Operation failed.");
      expect(mockLoggerError).toHaveBeenCalledWith("random error in bot endpoint");
    });
  });
});
