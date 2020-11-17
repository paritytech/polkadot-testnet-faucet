const mSDK = require('matrix-js-sdk');
const axios = require('axios');
const pdKeyring = require('@polkadot/keyring');
require('dotenv').config()

const botUserId = process.env.MATRIX_BOT_USER_ID;
const accessToken = process.env.MATRIX_ACCESS_TOKEN;
const baseURL = process.env.BACKEND_URL;

console.log(botUserId);

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

const sendMessage = (roomId, msg) => {
  bot.sendEvent(
    roomId,
    'm.room.message',
    { 'body': msg, 'msgtype': 'm.text' },
    '',
    console.error,
  );
}

bot.on('RoomMember.membership', (_, member) => {
  if (member.membership === 'invite' && member.userId === botUserId) {
    bot.joinRoom(member.roomId).done(() => {
      console.log(`Auto-joined ${member.roomId}.`);
    });
  }
});

bot.on('Room.timeline', async (event) => {
  if (event.getType() !== 'm.room.message') {
    return; // Only act on messages (for now).
  }

  const { content: { body }, event_id: eventId, room_id: roomId, sender } = event.event;

  let [action, arg0, arg1] = body.split(' ');

  if (action === '!balance') {
    try {
      const res = await ax.get('/balance');
      const balance = res.data;
      
      // FIXME hardcoded
      bot.sendHtmlMessage(roomId, `The faucet has ${balance/10**15} CANs remaining.`, `The faucet has ${balance/10**15} CANs remaining.`)
    } catch (e) {
      bot.sendHtmlMessage(roomId, `An error occured, please check the server logs.`)
      console.error('An error occured when checking the balance', e)
    }

  }

  if (action === '!drip') {
    try {
      pdKeyring.decodeAddress(arg0);
    } catch (e) {
      sendMessage(roomId, `${sender} provided an incompatible address.`);
      return;
    }

    if (sender.endsWith(':matrix.parity.io') && arg1) {
      amount = arg1;
    }

    try {
      const res = await ax.post('/bot-endpoint', {
        sender,
        address: arg0,
        amount,
      });

      if (!res) {
        sendMessage(roomId, `An unexpected error occured, please check the server logs`);
        return;
      }

      if (res.data === 'LIMIT') {
        sendMessage(roomId, `${sender} has reached their daily quota. Only request twice per 24 hours.`);
        return;
      }

      // FIXME hardcoded
      bot.sendHtmlMessage(
        roomId,
        `Sent ${sender} ${amount} mCANs. Extrinsic hash: ${res.data}.`,
        `Sent ${sender} ${amount} mCANs.`
      );
    } catch(e) {
        sendMessage(roomId, `An unexpected error occured, please check the server logs`);
        console.error('An error occured when dripping', e)
    }
    
  }

  if (action === '!faucet') {
    // FIXME hardcoded
    sendMessage(roomId, `
Usage:
  !balance - Get the faucet's balance.
  !drip <Address> - Send Canvas CANs to <Address>.
  !faucet - Prints usage information.`);
  }
});

bot.startClient(0);
