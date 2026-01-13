import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  id: string;
  type: 'restaurant' | 'consumer';
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer') {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;

    (req as any).user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(500).json({ error: 'Erro ao validar token' });
  }
};

export const isRestaurant = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.type !== 'restaurant') {
    return res.status(403).json({ error: 'Acesso restrito a restaurantes' });
  }

  next();
};

export const isConsumer = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.type !== 'consumer') {
    return res.status(403).json({ error: 'Acesso restrito a consumidores' });
  }

  next();
};