import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { DecodedToken, UserRole } from '../models/types';

export interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Formato do token inválido.' });
    return;
  }

  const token = parts[1];

  if (!token) {
    res.status(401).json({ error: 'Token de autenticação vazio.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedToken;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token de autenticação inválido ou expirado.' });
  }
}

export function roleMiddleware(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autorizado.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado para este perfil.' });
      return;
    }

    next();
  };
}
