import type { WalletProvider, WalletRequest, WalletResponse } from '../types/integrations.js';

export class ExternalWalletAdapter {
  private readonly provider: WalletProvider;

  constructor(provider: WalletProvider) {
    this.provider = provider;
  }

  async createPaymentSession(request: WalletRequest): Promise<WalletResponse> {
    const base = {
      ok: true,
      provider: this.provider,
      status: 'enabled' as const,
      message: 'Sesión creada correctamente.'
    };

    if (this.provider === 'local-wallet') {
      return {
        ...base,
        transactionId: `local_${Date.now()}`,
        redirectUrl: `/checkout/success?ref=${encodeURIComponent(request.reference)}`
      };
    }

    return {
      ...base,
      transactionId: `${this.provider}_${Date.now()}`,
      redirectUrl: `https://example.com/pay/${this.provider}/${request.reference}`
    };
  }

  async verifyPayment(reference: string): Promise<{ ok: boolean; status: string; reference: string }> {
    return {
      ok: true,
      status: 'paid',
      reference
    };
  }
}
