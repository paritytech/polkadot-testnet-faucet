import { decodeAddress } from "@polkadot/keyring";
import axios from "axios";
import dotenv from "dotenv";
import * as mSDK from "matrix-js-sdk";
import request from "request";

import { config } from "../config";
import { getDripRequestHandlerInstance } from "../dripper/DripRequestHandler";
import polkadotActions from "../dripper/polkadot/PolkadotActions";
import { convertAmountToBn, convertBnAmountToNumber } from "../dripper/polkadot/utils";
import { isDripSuccessResponse } from "../guards";
import { logger } from "../logger";
import { getNetworkData } from "../networkData";
import { APIVersionResponse } from "../server/routes/healthcheck";
import type { BalanceResponse } from "../types";
import { isAccountPrivileged } from "../utils";

dotenv.config();

const dripRequestHandler = getDripRequestHandlerInstance(polkadotActions);

const botUserId = config.Get("MATRIX_BOT_USER_ID");
const accessToken = config.Get("MATRIX_ACCESS_TOKEN");
const baseURL = config.Get("BACKEND_URL");

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

const ignoreList = config
  .Get("FAUCET_IGNORE_LIST")
  .split(",")
  .map((item) => item.replace('"', ""));
const botDeployedRef = config.Get("DEPLOYED_REF");
const botDeployedTime = config.Get("DEPLOYED_TIME");

// Show the ignore list at start if any
if (ignoreList.length > 0) {
  logger.info(`Ignore list: (${ignoreList.length} entries)`);
  ignoreList.forEach((account) => logger.info(` '${account}'`));
}

const bot = mSDK.createClient({
  accessToken,
  baseUrl: config.Get("MATRIX_SERVER"),
  localTimeoutMs: 10000,
  request, // workaround for failed syncs - https://github.com/matrix-org/matrix-js-sdk/issues/2415#issuecomment-1255755056
  userId: botUserId,
});

const ax = axios.create({ baseURL, timeout: 10000 });

const sendMessage = (roomId: string, msg: string) => {
  bot
    .sendEvent(roomId, "m.room.message", { body: msg, msgtype: "m.text" }, "", (err) => {
      if (err) logger.error(err);
    })
    .catch((e) => logger.error(e));
};

const printHelpMessage = (roomId: string, message = "") =>
  sendMessage(
    roomId,
    `${message ? `${message} - ` : ""}The following commands are supported:
!balance - Get the faucet's balance.
!drip <Address>[:ParachainId] - Send ${
      networkData.currency
    }s to <Address>, if the optional suffix \`:SomeParachainId\` is given a teleport will be issued.
!help - Print this message`,
  );

bot.on("RoomMember.membership", (_, member: Record<string, string>) => {
  if (member.membership === "invite" && member.userId === botUserId) {
    bot
      .joinRoom(member.roomId)
      .then(() => {
        logger.info(`Auto-joined ${member.roomId}.`);
      })
      .catch((e) => logger.error("⭕ Auto-join error", e));
  }
});

bot.on("Room.timeline", (event: mSDK.MatrixEvent) => {
  const sender = event.getSender();
  const roomId = event.getRoomId();
  const { body } = event.getContent();

  // only act on messages
  if (event.getType() !== "m.room.message") {
    return;
  }

  // ignore our own messages or when sender is undefined
  if (!sender || sender === botUserId) {
    return;
  }

  // Ignore blacklisted accounts
  if (ignoreList.includes(sender)) {
    logger.warn(`🏴‍☠️ Ignored request from an ignored account: ${sender}`);
    return;
  }

  logger.debug(`Processing request from ${sender}`);

  let dripAmount: bigint = convertAmountToBn(networkData.dripAmount);
  const [action, arg0, arg1] = body.split(" ");

  if (action === "!version") {
    ax.get<APIVersionResponse>("/version")
      .then((res) => {
        const { data } = res;
        const { version, time } = data;

        sendMessage(
          roomId,
          `Versions:
          Bot: ${botDeployedRef}; ${botDeployedTime}
          Server: ${version}; ${time}`,
        );
      })
      .catch((e) => {
        sendMessage(roomId, "An error occurred, please check the server logs.");
        logger.error("⭕ An error occurred when checking the balance", e);
      });
  } else if (action === "!balance") {
    ax.get<BalanceResponse>("/balance")
      .then((res) => {
        const balance = Number(res.data.balance);

        sendMessage(
          roomId,
          `The faucet has ${balance / 10 ** networkData.decimals} ${networkData.currency}s remaining.`,
        );
      })
      .catch((e) => {
        sendMessage(roomId, "An error occurred, please check the server logs.");
        logger.error("⭕ An error occurred when checking the balance", e);
      });
  } else if (action === "!drip") {
    if (!arg0) {
      logger.warn("Address not provided, skipping");
      return;
    }

    const arg0_processed = arg0.trim().split(":");
    const address = arg0_processed[0];
    const parachain_id = arg0_processed[1] ? arg0_processed[1] : "";
    logger.debug(`Processed receiver to address ${address} and parachain id ${parachain_id}`);

    try {
      decodeAddress(address);
    } catch (e) {
      sendMessage(roomId, `${sender} provided an incompatible address.`);
      return;
    }

    // Parity users can override the drip amount by using a 3rd argument
    if (arg1 && isAccountPrivileged(sender)) {
      dripAmount = convertAmountToBn(arg1);

      // not sending these messages to matrix room, since this feature only for internal users
      // who have access to loki logs
      if (Number.isNaN(dripAmount)) {
        logger.error(
          `⭕ Failed to convert drip amount: "${arg1}" to number, defaulting to ${networkData.dripAmount} ${networkData.currency}s`,
        );
        dripAmount = convertAmountToBn(networkData.dripAmount);
      }

      if (dripAmount <= 0) {
        logger.error(
          `⭕ Drip amount can't be less than 0, got ${dripAmount}, defaulting to ${networkData.dripAmount} ${networkData.currency}s`,
        );
        dripAmount = convertAmountToBn(networkData.dripAmount);
      }
    }

    dripRequestHandler
      .handleRequest({ external: false, address, parachain_id, amount: dripAmount, sender })
      .then((res) => {
        // if hash is null or empty, something went wrong
        if (!isDripSuccessResponse(res)) {
          sendMessage(roomId, res.error || "An unexpected error occurred, please check the server logs");
          return;
        }

        sendMessage(
          roomId,
          `Sent ${sender} ${convertBnAmountToNumber(dripAmount)} ${networkData.currency}s. Extrinsic hash: [${
            res.hash
          }]()`,
        );
      })
      .catch((e) => {
        sendMessage(roomId, "An unexpected error occurred, please check the server logs");
        logger.error("⭕ An error occurred when dripping", e);
      });
  } else if (action === "!help") {
    printHelpMessage(roomId);
  } else if (action.startsWith("!")) {
    printHelpMessage(roomId, "Unknown command");
  }
});

export const startBot = () => {
  bot.startClient({ initialSyncLimit: 0 }).catch((e) => logger.error(e));
};
