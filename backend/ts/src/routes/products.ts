import { Router } from 'express';
import { getProducts, getProductById, createProduct } from '../services/products.js';

export const productsRouter = Router();

productsRouter.get('/', async (_req, res) => {
  const response = await getProducts();
  if (!response.ok) {
    return res.status(500).json(response);
  }

  return res.json(response);
});

productsRouter.get('/:id', async (req, res) => {
  const response = await getProductById(req.params.id);
  if (!response.ok) {
    return res.status(500).json(response);
  }

  return res.json(response);
});

productsRouter.post('/', async (req, res) => {
  const response = await createProduct(req.body ?? {});
  if (!response.ok) {
    return res.status(400).json(response);
  }

  return res.status(201).json(response);
});
