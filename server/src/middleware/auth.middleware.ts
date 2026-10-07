import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from '../utils/prisma';
import { verifyToken } from '../utils/jwt';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!dbUser) {
      res.status(401).json({ error: 'User account not found or deactivated' });
      return;
    }

    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorize = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRoleUpper = req.user.role?.toUpperCase();
    const allowedRolesUpper = roles.map((r) => r.toUpperCase());

    if (!allowedRolesUpper.includes(userRoleUpper)) {
      res.status(403).json({
        error: `Insufficient permissions: You are currently signed in as a ${req.user.role}, but this action requires a ${roles.join(' or ')} account.`,
      });
      return;
    }
    next();
  };
};
