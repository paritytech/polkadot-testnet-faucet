import { decodeAddress } from '@polkadot/keyring';
import axios from 'axios';
import * as mSDK from 'matrix-js-sdk';

import envVars from '../env';
import { isDripSuccessResponse } from '../guards';
import type { BalanceResponse, DripResponse } from '../types';
import { logger } from '../utils';

const botUserId = envVars.MATRIX_BOT_USER_ID;
const accessToken = envVars.MATRIX_ACCESS_TOKEN;
const baseURL = envVars.BACKEND_URL;
const matrixBaseURL = envVars.MATRIX_BASE_URL;
const decimals = envVars.NETWORK_DECIMALS;
const unit = envVars.NETWORK_UNIT;
const defaultDripAmount = envVars.DRIP_AMOUNT;
const ignoreList = envVars.FAUCET_IGNORE_LIST.split(',').map((item) =>
  item.replace('"', '')
);

// Show the ignore list at start if any
if (ignoreList.length > 0) {
  logger.info(`Ignore list: (${ignoreList.length} entries)`);
  ignoreList.forEach((account) => logger.info(` '${account}'`));
}

const bot = mSDK.createClient({
  accessToken,
  baseUrl: matrixBaseURL,
  localTimeoutMs: 10000,
  userId: botUserId,
});

const ax = axios.create({
  baseURL,
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
!drip <Address> - Send ${unit}s to <Address>.
!help - Print this message`
  );

bot.on('RoomMember.membership', (_, member: Record<string, string>) => {
  if (member.membership === 'invite' && member.userId === botUserId) {
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
  if (!sender || sender === botUserId) {
    return;
  }

  // Ignore blacklisted accounts
  if (ignoreList.includes(sender)) {
    logger.warn(`🏴‍☠️ Ignored request from an ignored account: ${sender}`);
    return;
  }

  logger.debug(`Processing request from ${sender}`);

  let dripAmount = defaultDripAmount;
  const [action, arg0, arg1] = body.split(' ');

  if (action === '!balance') {
    ax.get<BalanceResponse>('/balance')
      .then((res) => {
        const balance = Number(res.data.balance);

        sendMessage(
          roomId,
          `The faucet has ${balance / 10 ** decimals} ${unit}s remaining.`
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

    const address = arg0.trim();

    try {
      decodeAddress(address);
    } catch (e) {
      sendMessage(roomId, `${sender} provided an incompatible address.`);
      return;
    }

    // Parity users can override the drip amount by using a 3rd argument
    if (sender.endsWith(':matrix.parity.io') && arg1) {
      dripAmount = Number(arg1);
    }

    ax.post<DripResponse>('/bot-endpoint', {
      address,
      amount: dripAmount,
      sender,
    })
      .then((res) => {
        // if hash is null or empty, something went wrong
        const message = isDripSuccessResponse(res.data)
          ? `Sent ${sender} ${dripAmount} ${unit}s. Extrinsic hash: ${res.data.hash}`
          : res.data.error ||
            'An unexpected error occured, please check the server logs';

        sendMessage(roomId, message);
      })
      .catch((e) => {
        sendMessage(
          roomId,
          (e as Error).message ||
            'An unexpected error occured, please check the server logs'
        );
        logger.error('⭕ An error occured when dripping', e);
      });
  } else if (action === '!help') {
    printHelpMessage(roomId);
  } else if (action.startsWith('!')) {
    printHelpMessage(roomId, 'Unknown command');
  }
});

bot.startClient({ initialSyncLimit: 0 }).catch((e) => logger.error(e));
