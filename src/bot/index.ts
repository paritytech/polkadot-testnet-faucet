import { decodeAddress } from '@polkadot/keyring';
import axios from 'axios';
import dotenv from 'dotenv';
import * as mSDK from 'matrix-js-sdk';

import { logger, verifyEnvVariables } from '../utils';

dotenv.config();

const botUserId = process.env.MATRIX_BOT_USER_ID;
const accessToken = process.env.MATRIX_ACCESS_TOKEN;
const baseURL = process.env.BACKEND_URL;
const decimals = Number(process.env.NETWORK_DECIMALS) || 12;
const unit = process.env.NETWORK_UNIT || '';
const defaultDripAmount = process.env.DRIP_AMOUNT || 5;

verifyEnvVariables();

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const bot = mSDK.createClient({
  accessToken,
  baseUrl: 'https://matrix.org',
  localTimeoutMs: 10000,
  userId: botUserId
});

const ax = axios.create({
  baseURL,
  timeout: 10000

});

const sendMessage = (roomId: string, msg: string) => {
  bot.sendEvent(
    roomId,
    'm.room.message',
    { body: msg, msgtype: 'm.text' },
    '',
    (err) => {
      if (err) logger.error(err);
    }
  ).catch((e) =>
    logger.error(e)
  );
};

bot.on('RoomMember.membership', (_, member: Record<string, string>) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (member.membership === 'invite' && member.userId === botUserId) {
    bot.joinRoom(member.roomId).then(() => {
      logger.info(`Auto-joined ${member.roomId}.`);
    }).catch((e) => logger.error(e));
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

  let dripAmount = defaultDripAmount;
  const [action, arg0, arg1] = body.split(' ');

  if (action === '!balance') {
    ax.get('/balance').then((res) => {
      const balance = Number(res.data);

      sendMessage(roomId, `The faucet has ${balance / 10 ** decimals} ${unit}s remaining.`);
    }).catch((e) => {
      sendMessage(roomId, 'An error occured, please check the server logs.');
      logger.error('An error occured when checking the balance', e);
    });
  } else if (action === '!drip') {
    try {
      decodeAddress(arg0);
    } catch (e) {
      sendMessage(roomId, `${sender} provided an incompatible address.`);
      return;
    }

    // Parity users can override the drip amount by using a 3rd argument
    if (sender.endsWith(':matrix.parity.io') && arg1) {
      dripAmount = arg1;
    }

    ax.post('/bot-endpoint', {
      address: arg0,
      amount: dripAmount,
      sender
    }).then((res) => {
      if (!res) {
        sendMessage(roomId, 'An unexpected error occured, please check the server logs.');
        return;
      }

      if (res.data === 'LIMIT') {
        sendMessage(roomId, `${sender} has reached their daily quota. Only request twice per 24 hours.`);
        return;
      }

      sendMessage(roomId, `Sent ${sender} ${dripAmount} ${unit}s. Extrinsic hash: ${res.data as string}`);
    }).catch((e) => {
      sendMessage(roomId, 'An unexpected error occured, please check the server logs');
      logger.error('An error occured when dripping', e);
    });
  } else {
    sendMessage(roomId, `Only the following commands are supported:
  !balance - Get the faucet's balance.
  !drip <Address> - Send ${unit}s to <Address>.`);
  }
});

bot.startClient(0).catch((e) => logger.error(e));
