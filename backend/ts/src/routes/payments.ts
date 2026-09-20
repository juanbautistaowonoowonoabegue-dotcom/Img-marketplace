import { Router } from 'express';
import { PaymentService } from '../services/payments.js';

export const paymentsRouter = Router();
const paymentService = new PaymentService();

paymentsRouter.post('/create', async (req, res) => {
  const provider = req.body?.provider ?? 'local-wallet';
  const request = req.body?.request ?? {};

  const response = await paymentService.createPayment(provider, request);
  if (!response.ok) {
    return res.status(400).json(response);
  }

  return res.status(201).json(response);
});

paymentsRouter.post('/verify', async (req, res) => {
  const { reference, provider } = req.body ?? {};

  if (!reference || !provider) {
    return res.status(400).json({ ok: false, error: 'reference y provider son obligatorios' });
  }

  const result = await new (await import('../services/integrations.js')).IntegrationService().verifyWallet(reference, provider);
  return res.json({ ok: true, data: result });
});
