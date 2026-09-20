import type { WalletRequest, WalletResponse } from '../types/integrations.js';
import { ExternalWalletAdapter } from './external-wallets.js';

export class IntegrationService {
  async createWalletPayment(provider: 'stripe' | 'paypal' | 'mercado-pago' | 'paystack' | 'local-wallet', request: WalletRequest): Promise<WalletResponse> {
    const adapter = new ExternalWalletAdapter(provider);
    return adapter.createPaymentSession(request);
  }

  async verifyWallet(reference: string, provider: string) {
    const adapter = new ExternalWalletAdapter(provider as 'stripe' | 'paypal' | 'mercado-pago' | 'paystack' | 'local-wallet');
    return adapter.verifyPayment(reference);
  }
}
