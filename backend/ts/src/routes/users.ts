import { Router } from 'express';
import { getUserById, getUsers } from '../services/users.js';

export const usersRouter = Router();

usersRouter.get('/', async (_req, res) => {
  const response = await getUsers();
  if (!response.ok) {
    return res.status(500).json(response);
  }

  return res.json(response);
});

usersRouter.get('/:uid', async (req, res) => {
  const response = await getUserById(req.params.uid);
  if (!response.ok) {
    return res.status(500).json(response);
  }

  return res.json(response);
});
