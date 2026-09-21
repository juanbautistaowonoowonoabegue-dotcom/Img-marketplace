import type { ApiResponse } from '../types.js';
import type { WalletProvider, WalletRequest, WalletResponse } from '../types/integrations.js';
import { IntegrationService } from './integrations.js';

export class PaymentService {
  private readonly integrationService = new IntegrationService();

  async createPayment(provider: WalletProvider, request: WalletRequest): Promise<ApiResponse<WalletResponse>> {
    try {
      const result = await this.integrationService.createWalletPayment(provider, request);
      return { ok: true, data: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { ok: false, error: `No se pudo iniciar el pago: ${message}` };
    }
  }
}
