import { DripResponse, DripSuccessResponse } from "./types.js";

export const isDripSuccessResponse = (res: DripResponse): res is DripSuccessResponse =>
  Boolean((res as DripSuccessResponse).hash);
