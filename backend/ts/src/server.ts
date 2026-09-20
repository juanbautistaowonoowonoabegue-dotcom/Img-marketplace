import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { productsRouter } from './routes/products.js';
import { usersRouter } from './routes/users.js';
import { paymentsRouter } from './routes/payments.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Compra Ya backend OK', version: '0.1.0' });
});

app.use('/api/products', productsRouter);
app.use('/api/users', usersRouter);
app.use('/api/payments', paymentsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Error interno';
  res.status(500).json({ ok: false, error: message });
});

app.listen(config.port, () => {
  console.log(`Backend TypeScript escuchando en http://localhost:${config.port}`);
});
