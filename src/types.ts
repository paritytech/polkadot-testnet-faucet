export type TypeofMap = {
  string: string;
  number: number;
  boolean: boolean;
};
export interface MetricsDefinition {
  meta: {
    prefix: string;
  };
  data: { [id: string]: number };
}

export interface BalanceResponse {
  balance: string;
}

export interface DripErrorResponse {
  error: string;
}

export interface DripSuccessResponse {
  hash: string;
}

export type DripResponse = DripErrorResponse | DripSuccessResponse;

export interface BotRequestType {
  address: string;
  amount: string;
  sender: string;
}
