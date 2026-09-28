import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyToken } from '../utils/jwt';
import prisma from '../utils/prisma';

/**
 * Verifies the JWT, then re-checks the user in the database so that
 *  - deleted users can no longer use an old token,
 *  - suspended users are locked out immediately,
 *  - role changes (e.g. an admin being demoted) apply straight away
 *    instead of waiting for the token to expire.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  let decoded;
  try {
    decoded = verifyToken(authHeader.split(' ')[1]);
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Account no longer exists' });
      return;
    }
    if (user.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Your account has been suspended', code: 'ACCOUNT_SUSPENDED' });
      return;
    }

    req.user = { userId: user.id, email: user.email, role: user.role as Role };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};
