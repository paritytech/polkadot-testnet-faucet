import mSDK from 'matrix-js-sdk';
import axios from 'axios';
import { decodeAddress } from '@polkadot/keyring';
import {logger, verifyEnvVariables} from '../utils';
require('dotenv').config()

const botUserId = process.env.MATRIX_BOT_USER_ID;
const accessToken = process.env.MATRIX_ACCESS_TOKEN;
const baseURL = process.env.BACKEND_URL;
const decimals = Number(process.env.NETWORK_DECIMALS) || 12;
const unit = process.env.NETWORK_UNIT;
const defaultDripAmount = process.env.DRIP_AMOUNT;

verifyEnvVariables();

const bot = mSDK.createClient({
  baseUrl: 'https://matrix.org',
  accessToken,
  userId: botUserId,
  localTimeoutMs: 10000,
});

let ax = axios.create({
  baseURL,
  timeout: 10000,

});

const sendMessage = (roomId: string, msg: string) => {
  bot.sendEvent(
    roomId,
    'm.room.message',
    { 'body': msg, 'msgtype': 'm.text' },
    '',
    logger.error,
  );
}

bot.on('RoomMember.membership', (_, member) => {
  if (member.membership === 'invite' && member.userId === botUserId) {
    bot.joinRoom(member.roomId).then(() => {
      logger.info(`Auto-joined ${member.roomId}.`);
    });
  }
});

bot.on('Room.timeline', async (event) => {
  if (event.getType() !== 'm.room.message') {
    return; // Only act on messages (for now).
  }

  const { content: { body }, room_id: roomId, sender } = event.event;
  
  // Sender is undefined for our own messages
  if (!sender) {
    return;
  }

  let dripAmount = defaultDripAmount
  let [action, arg0, arg1] = body.split(' ');

  if (action === '!balance') {
    try {
      const res = await ax.get('/balance');
      const balance = res.data;
      
      sendMessage(roomId, `The faucet has ${balance/10**decimals} ${unit}s remaining.`)
    } catch (e) {
      sendMessage(roomId, `An error occured, please check the server logs.`)
      logger.error('An error occured when checking the balance', e)
    }

  } else if (action === '!drip') {
    try {
      decodeAddress(arg0);
    } catch (e) {
      sendMessage(roomId, `${sender} provided an incompatible address.`);
      return;
    }

    // parity users can override the drip amount by using a 3rd argument
    if (sender.endsWith(':matrix.parity.io') && arg1) {
      dripAmount = arg1;
    }
    try {
      const res = await ax.post('/bot-endpoint', {
        sender,
        address: arg0,
        amount: dripAmount,
      });

      if (!res) {
        sendMessage(roomId, `An unexpected error occured, please check the server logs.`);
        return;
      }

      if (res.data === 'LIMIT') {
        sendMessage(roomId, `${sender} has reached their daily quota. Only request twice per 24 hours.`);
        return;
      }

      sendMessage(roomId, `Sent ${sender} ${dripAmount} ${unit}s. Extrinsic hash: ${res.data}`);
    } catch(e) {
        sendMessage(roomId, `An unexpected error occured, please check the server logs`);
        logger.error('An error occured when dripping', e)
    }
    
  } else {
    sendMessage(roomId, `
The following commands are supported:
  !balance - Get the faucet's balance.
  !drip <Address> - Send ${unit}s to <Address>.`);
  }
});

bot.startClient(0);
