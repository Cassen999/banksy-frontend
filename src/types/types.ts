export interface iUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface iPlaidLinkTokenResponse {
  link_token: string;
}

export interface iPlaidExchangeRequest {
  publicToken: string;
  institutionId: string;
  institutionName: string;
  expiredItemId?: string | null;
}

export interface iPlaidExchangeResponse {
  status: 'ok';
  message: string;
}

export interface iMonthlyGlanceDailyTotal {
  transactionDate: string;
  total: number;
}

export interface iMonthlyGlanceResponse {
  dailyTotals: iMonthlyGlanceDailyTotal[];
  relinkRequired: unknown[];
}

export interface iMonthlyGlanceDataPoint {
  date: string;
  cumulative: number;
  daily: number;
}
