import { decodeAddress } from "@polkadot/keyring";
import * as mSDK from "matrix-js-sdk";

import { config } from "../config";
import { getDripRequestHandlerInstance } from "../dripper/DripRequestHandler";
import polkadotActions from "../dripper/polkadot/PolkadotActions";
import { convertAmountToBn, convertBnAmountToNumber, formatAmount } from "../dripper/polkadot/utils";
import { isDripSuccessResponse } from "../guards";
import { logger } from "../logger";
import { getNetworkData } from "../networkData";
import { isAccountPrivileged } from "../utils";

const dripRequestHandler = getDripRequestHandlerInstance(polkadotActions);

const botUserId = config.Get("MATRIX_BOT_USER_ID");
const accessToken = config.Get("MATRIX_ACCESS_TOKEN");

const deployedRef = config.Get("DEPLOYED_REF");

const networkName = config.Get("NETWORK");
const networkData = getNetworkData(networkName);

const ignoreList = config
  .Get("FAUCET_IGNORE_LIST")
  .split(",")
  .map((item) => item.replace('"', ""));

// Show the ignore list at start if any
if (ignoreList.length > 0) {
  logger.info(`Ignore list: (${ignoreList.length} entries)`);
  ignoreList.forEach((account) => logger.info(` '${account}'`));
}

const bot = mSDK.createClient({
  accessToken,
  baseUrl: config.Get("MATRIX_SERVER"),
  localTimeoutMs: 10000,
  userId: botUserId,
});

const sendMessage = (roomId: string, msg: string, formattedMsg?: string) => {
  const msgObject: mSDK.IContent = { body: msg, msgtype: "m.text" };

  if (formattedMsg !== undefined) {
    msgObject.format = "org.matrix.custom.html";
    msgObject.formatted_body = formattedMsg;
  }

  bot.sendEvent(roomId, null, "m.room.message", msgObject, "").catch((e) => logger.error(e));
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

bot.on(mSDK.RoomEvent.MyMembership, (room: mSDK.Room, membership: string) => {
  if (membership === "invite") {
    bot
      .joinRoom(room.roomId)
      .then(() => {
        logger.info(`Auto-joined ${room.roomId}.`);
      })
      .catch((e) => logger.error("⭕ Auto-join error", e));
  }
});

bot.on(mSDK.RoomEvent.Timeline, (event: mSDK.MatrixEvent) => {
  const sender = event.getSender();
  const roomId = event.getRoomId();
  const { body } = event.getContent<{ body: string }>();

  if (roomId === undefined) {
    // Should never happen for a "Room.timeline" event
    throw new Error("roomId is not defined");
  }

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
    sendMessage(roomId, `Current version: ${deployedRef}`);
  } else if (action === "!balance") {
    (async () => {
      const balance = BigInt(await polkadotActions.getBalance());
      const displayBalance = formatAmount(balance);

      sendMessage(roomId, `The faucet has ${displayBalance} ${networkData.currency}s remaining.`);
    })().catch((e) => {
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

        const message = formattedSuccessfulDripResponse(dripAmount, sender, res.hash);

        sendMessage(roomId, message.plain, message.formatted);
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

export async function startBot(): Promise<void> {
  if (!accessToken) return;
  // Resolving on error allows web server to start even if matrix is imparied
  await new Promise<void>((resolve) => {
    bot
      .startClient({ initialSyncLimit: 0 })
      .then(() => {
        bot.once(mSDK.ClientEvent.Sync, (state) => {
          if (state === "PREPARED") {
            resolve();
          }
        });

        bot.once(mSDK.ClientEvent.SyncUnexpectedError, (e) => {
          logger.error("Matrix bot SyncUnexpectedError: ", e);
          resolve();
        });
      })
      .catch((e) => {
        logger.error("Matrix bot did not start: ", e);
        resolve();
      });
  });
}

function formattedSuccessfulDripResponse(
  dripAmount: bigint,
  sender: string,
  extrinsicHash: string,
): {
  plain: string;
  formatted: string;
} {
  const numberDripAmount = convertBnAmountToNumber(dripAmount);
  const extrinsicLink = networkData.explorer !== null ? `${networkData.explorer}/extrinsic/${extrinsicHash}` : null;

  const messagePlain = `Sent ${sender} ${numberDripAmount} ${networkData.currency}s.
Extrinsic hash: ${extrinsicHash}`;
  let messageHtml = `Sent ${sender} ${numberDripAmount} ${networkData.currency}s.`;
  if (extrinsicLink !== null) {
    messageHtml += `<br />Extrinsic hash: <a href="${extrinsicLink}">${extrinsicHash}</a>`;
  } else {
    messageHtml += `<br />Extrinsic hash: ${extrinsicHash}`;
  }

  return { plain: messagePlain, formatted: messageHtml };
}
