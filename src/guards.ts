import { DripResponse, DripSuccessResponse } from './types';

export const isDripSuccessResponse = (res: DripResponse): res is DripSuccessResponse =>
  Boolean((res as DripSuccessResponse).hash);
