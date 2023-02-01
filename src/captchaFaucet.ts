import functions from "@google-cloud/functions-framework";
import axios from "axios";
import { URLSearchParams } from "url";

import { Actions } from "./server/services/Actions";

const RECAPTCHA_SECRET = "SECRET 1";
const ROCOCO_PARACHAIN_ID = "1002";
const DRIP_AMOUNT = "1";

/**
 * Responds to an HTTP request using data from the request body parsed according
 * to the "content-type" header.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
functions.http("captcha", async (req, res) => {
  const actions = new Actions();
  const query = req.query.captcha || req.body.captcha;
  if (!req.query.address) {
    throw new Error("Missing address field");
  }
  const address = req.query.address as string;
  const params = new URLSearchParams();
  params.append("secret", RECAPTCHA_SECRET);
  params.append("response", query);
  const captchaResult = await axios.post("https://www.google.com/recaptcha/api/siteverify", params);

  if (!captchaResult.data.success) return;

  const sendTokensResult = await actions.sendTokens(address, ROCOCO_PARACHAIN_ID, DRIP_AMOUNT);
  res.send(sendTokensResult);
});
