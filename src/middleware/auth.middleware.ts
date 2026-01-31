import { NextFunction, Request, Response } from 'express';
import { auth } from '../utils/auth.js';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session) {
      return res.status(401).json({ error: 'Sessão inválida ou não encontrada' });
    }

    (req as any).user = session.user;
    (req as any).session = session.session;

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao validar sessão' });
  }
};

export const isRestaurant = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== 'RESTAURANT') {
    return res.status(403).json({ error: 'Acesso restrito a restaurantes' });
  }

  next();
};

export const isConsumer = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== 'CONSUMER') {
    return res.status(403).json({ error: 'Acesso restrito a consumidores' });
  }

  next();
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }

  next();
};
