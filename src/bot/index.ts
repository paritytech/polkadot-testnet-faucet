import { decodeAddress } from '@polkadot/keyring';
import axios from 'axios';
import dotenv from 'dotenv';
import * as mSDK from 'matrix-js-sdk';

import { faucetConfig } from '../faucetConfig';
import { isDripSuccessResponse } from '../guards';
import type { BalanceResponse, DripResponse } from '../types';
import { isAccountPrivileged, logger } from '../utils';

dotenv.config();

const config = faucetConfig('bot');

const BOT_USER_ID = config.Get('BOT', 'MATRIX_BOT_USER_ID') as string;
const ACCESS_TOKEN = config.Get('BOT', 'MATRIX_ACCESS_TOKEN') as string;
const BASE_URL = config.Get('BOT', 'BACKEND_URL') as string;
const DECIMALS = config.Get('BOT', 'NETWORK_DECIMALS') as number;
const NETWORK_UNIT = config.Get('BOT', 'NETWORK_UNIT') as string;
const DEFAULT_DRIP_AMOUNT = config.Get('BOT', 'DRIP_AMOUNT') as number;
const IGNORE_LIST = (config.Get('BOT', 'FAUCET_IGNORE_LIST') as string)
  .split(',')
  .map((item) => item.replace('"', ''));

// Show the ignore list at start if any
if (IGNORE_LIST.length > 0) {
  logger.info(`Ignore list: (${IGNORE_LIST.length} entries)`);
  IGNORE_LIST.forEach((account) => logger.info(` '${account}'`));
}

const bot = mSDK.createClient({
  accessToken: ACCESS_TOKEN,
  baseUrl: config.Get('BOT', 'MATRIX_SERVER'),
  localTimeoutMs: 10000,
  userId: BOT_USER_ID,
});

const ax = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

const sendMessage = (roomId: string, msg: string) => {
  bot
    .sendEvent(
      roomId,
      'm.room.message',
      { body: msg, msgtype: 'm.text' },
      '',
      (err) => {
        if (err) logger.error(err);
      }
    )
    .catch((e) => logger.error(e));
};

const printHelpMessage = (roomId: string, message = '') =>
  sendMessage(
    roomId,
    `${message ? `${message} - ` : ''}The following commands are supported:
!balance - Get the faucet's balance.
!drip <Address>[:ParachainId] - Send ${NETWORK_UNIT}s to <Address>, if the optional suffix \`:SomeParachainId\` is given a teleport will be issued.
!help - Print this message`
  );

bot.on('RoomMember.membership', (_, member: Record<string, string>) => {
  if (member.membership === 'invite' && member.userId === BOT_USER_ID) {
    bot
      .joinRoom(member.roomId)
      .then(() => {
        logger.info(`Auto-joined ${member.roomId}.`);
      })
      .catch((e) => logger.error('⭕ Auto-join error', e));
  }
});

bot.on('Room.timeline', (event: mSDK.MatrixEvent) => {
  const sender = event.getSender();
  const roomId = event.getRoomId();
  const { body } = event.getContent();

  // only act on messages
  if (event.getType() !== 'm.room.message') {
    return;
  }

  // ignore our own messages or when sender is undefined
  if (!sender || sender === BOT_USER_ID) {
    return;
  }

  // Ignore blacklisted accounts
  if (IGNORE_LIST.includes(sender)) {
    logger.warn(`🏴‍☠️ Ignored request from an ignored account: ${sender}`);
    return;
  }

  logger.debug(`Processing request from ${sender}`);

  let dripAmount = DEFAULT_DRIP_AMOUNT;
  const [action, arg0, arg1] = body.split(' ');

  if (action === '!balance') {
    ax.get<BalanceResponse>('/balance')
      .then((res) => {
        const balance = Number(res.data.balance);

        sendMessage(
          roomId,
          `The faucet has ${
            balance / 10 ** DECIMALS
          } ${NETWORK_UNIT}s remaining.`
        );
      })
      .catch((e) => {
        sendMessage(roomId, 'An error occured, please check the server logs.');
        logger.error('⭕ An error occured when checking the balance', e);
      });
  } else if (action === '!drip') {
    if (!arg0) {
      logger.warn('Address not provided, skipping');
      return;
    }

    const arg0_processed = arg0.trim().split(':');
    const address = arg0_processed[0];
    const parachain_id = arg0_processed[1] ? arg0_processed[1] : '';
    logger.debug(
      `Processed receiver to address ${address} and parachain id ${parachain_id}`
    );

    try {
      decodeAddress(address);
    } catch (e) {
      sendMessage(roomId, `${sender} provided an incompatible address.`);
      return;
    }

    // Parity users can override the drip amount by using a 3rd argument
    if (arg1 && isAccountPrivileged(sender)) {
      dripAmount = Number(arg1);

      // not sending these messages to matrix room, since this feature only for internal users
      // who have access to loki logs
      if (Number.isNaN(dripAmount)) {
        logger.error(
          `⭕ Failed to convert drip amount: "${arg1}" to number, defaulting to ${DEFAULT_DRIP_AMOUNT} ${NETWORK_UNIT}s`
        );
        dripAmount = DEFAULT_DRIP_AMOUNT;
      }

      if (dripAmount <= 0) {
        logger.error(
          `⭕ Drip amount can't be less than 0, got ${dripAmount}, defaulting to ${DEFAULT_DRIP_AMOUNT} ${NETWORK_UNIT}s`
        );
        dripAmount = DEFAULT_DRIP_AMOUNT;
      }
    }

    ax.post<DripResponse>('/bot-endpoint', {
      address,
      amount: dripAmount,
      parachain_id,
      sender,
    })
      .then((res) => {
        // if hash is null or empty, something went wrong
        const message = isDripSuccessResponse(res.data)
          ? `Sent ${sender} ${dripAmount} ${NETWORK_UNIT}s. Extrinsic hash: ${res.data.hash}`
          : res.data.error ||
            'An unexpected error occurred, please check the server logs';

        sendMessage(roomId, message);
      })
      .catch((e) => {
        sendMessage(
          roomId,
          (e as Error).message ||
            'An unexpected error occurred, please check the server logs'
        );
        logger.error('⭕ An error occurred when dripping', e);
      });
  } else if (action === '!help') {
    printHelpMessage(roomId);
  } else if (action.startsWith('!')) {
    printHelpMessage(roomId, 'Unknown command');
  }
});

bot.startClient({ initialSyncLimit: 0 }).catch((e) => logger.error(e));
