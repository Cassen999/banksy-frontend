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

export interface iScheduledDepositAmount {
  amount: number;
  isoCurrencyCode: string;
}

export interface iScheduledDeposit {
  merchantName: string | null;
  description: string | null;
  frequency: string;
  firstDate: string;
  lastDate: string;
  predictedNextDate: string;
  averageAmount: iScheduledDepositAmount | null;
  lastAmount: iScheduledDepositAmount | null;
  isActive: boolean;
  personalFinanceCategory: { primary: string; detailed: string } | null;
  status: string;
}

export interface iAccount {
  accountId: string;
  name: string;
  type: string;
  subtype: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  isoCurrencyCode: string | null;
  institutionName: string;
  customName: string | null;
}

export interface iBalanceResponse {
  accounts: iAccount[];
  relinkRequired: iRelinkSignal[];
}

export interface iTransaction {
  accountId: string;
  date: string;
  name: string;
  amount: number;
  isoCurrencyCode: string | null;
  category: string[];
}

export interface iTransactionsResponse {
  transactions: iTransaction[];
  total: number;
  relinkRequired: iRelinkSignal[];
}

export interface iAccountWithTransactions extends iAccount {
  transactions: iTransaction[];
  lastDeposit: iTransaction | null;
}

export interface iSetAccountNameRequest {
  customName: string;
}
