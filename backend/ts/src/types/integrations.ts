export type WalletProvider = 'stripe' | 'paypal' | 'mercado-pago' | 'paystack' | 'local-wallet';

export type IntegrationStatus = 'enabled' | 'disabled' | 'pending' | 'error';

export type WalletRequest = {
  amount: number;
  currency: string;
  reference: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
};

export type WalletResponse = {
  ok: boolean;
  provider: WalletProvider;
  status: IntegrationStatus;
  transactionId?: string;
  redirectUrl?: string;
  message?: string;
};

export type IntegrationEvent = {
  source: string;
  event: string;
  payload: Record<string, unknown>;
  receivedAt: string;
};
