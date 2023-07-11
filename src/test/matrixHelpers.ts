import { validatedFetch } from "@eng-automation/js";
import Joi from "joi";


type AccessTokenResponse = { access_token: string };

export async function getAccessToken(matrixUrl: string, params: { user: string, password: string }): Promise<string> {
  const response = await validatedFetch<AccessTokenResponse>(
    `${matrixUrl}/_matrix/client/v3/login`
    , Joi.object<AccessTokenResponse>({ access_token: Joi.string().required() }), {
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "type": "m.login.password", "user": params.user, "password": params.password })
      }
    });

  return response.access_token;
}

type RoomResponse = { room_id: string };

export async function createRoom(matrixUrl: string, params: {
  roomAliasName: string,
  accessToken: string
}): Promise<string> {
  const { room_id: roomId } = await validatedFetch<RoomResponse>(
    `${matrixUrl}/_matrix/client/v3/createRoom?access_token=${params.accessToken}`
    , Joi.object<RoomResponse>({ room_id: Joi.string().required() }), {
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "room_alias_name": "faucet" })
      }
    });

  return roomId;
}

export async function inviteUser(matrixUrl: string, params: {
  roomId: string,
  accessToken: string,
  userId: string
}): Promise<void> {
  await validatedFetch<{}>(
    `${matrixUrl}/_matrix/client/v3/rooms/${params.roomId}/invite?access_token=${params.accessToken}`
    , Joi.any(), {
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "user_id": params.userId })
      }
    });
}

export async function joinRoom(matrixUrl: string, params: {
  roomId: string,
  accessToken: string,
}): Promise<void> {
  await validatedFetch<{}>(
    `${matrixUrl}/_matrix/client/v3/rooms/${params.roomId}/join?access_token=${params.accessToken}`
    , Joi.any(), {
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      }
    });
}

export async function postMessage(matrixUrl: string, params: {
  roomId: string,
  accessToken: string,
  body: string
}): Promise<void> {
  await validatedFetch<{}>(
    `${matrixUrl}/_matrix/client/v3/rooms/${params.roomId}/send/m.room.message?access_token=${params.accessToken}`,
    Joi.any(), {
      init: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msgtype: "m.text",
          body: params.body
        })
      }
    });
}

type LatestMessageResponse = {
  chunk: [{
    sender: string,
    content: { body: string }
  }]
}

export async function getLatestMessage(matrixUrl: string, params: {
  roomId: string,
  accessToken: string,
}): Promise<{
  sender: string,
  body: string
}> {
  const res = await validatedFetch<LatestMessageResponse>(
    `${matrixUrl}/_matrix/client/v3/rooms/${params.roomId}/messages?dir=b&limit=1&access_token=${params.accessToken}`,
    Joi.object<LatestMessageResponse>({
      chunk: Joi.array().items(Joi.object({
        sender: Joi.string().required(),
        content: Joi.object({ body: Joi.string().required() })
      }).required())
    }), { init: { headers: { "Content-Type": "application/json" } } });

  return {
    sender: res.chunk[0].sender,
    body: res.chunk[0].content.body
  };
}
