import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { signToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth.middleware';
import { passwordResetRateLimit } from '../middleware/password-reset-rate-limit.middleware';
import { sendPasswordResetEmail } from '../services/email.service';
import { Role } from '@prisma/client';

const router = Router();
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_MESSAGE = 'If an account exists with this email, you will receive a password reset link.';
const invalidResetToken = () => new Error('INVALID_RESET_TOKEN');

const normalizeEmail = (email: unknown) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const hashResetToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, bio, skills } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const validRoles: Role[] = ['FREELANCER', 'CLIENT', 'ADMIN'];
    const userRole: Role = validRoles.includes(role) ? role : 'FREELANCER';

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
        bio: bio || null,
        skills: skills || [],
      },
      select: { id: true, name: true, email: true, role: true, bio: true, skills: true, avatar: true, rating: true, createdAt: true },
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/forgot-password', passwordResetRateLimit, async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body?.email);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Enter a valid email address' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.json({ message: PASSWORD_RESET_MESSAGE });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;

    if (!frontendUrl) {
      throw new Error('FRONTEND_URL is not configured');
    }

    const resetUrl = new URL('/reset-password', frontendUrl);
    resetUrl.searchParams.set('token', rawToken);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt } });

    try {
      await sendPasswordResetEmail({ recipient: user.email, recipientName: user.name, resetUrl: resetUrl.toString() });
    } catch (error) {
      await prisma.passwordResetToken.deleteMany({ where: { tokenHash } });
      console.error('Password reset email error:', error instanceof Error ? error.message : 'Unknown email error');
    }

    res.json({ message: PASSWORD_RESET_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error instanceof Error ? error.message : 'Unknown error');
    res.json({ message: PASSWORD_RESET_MESSAGE });
  }
});

router.post('/reset-password', passwordResetRateLimit, async (req: Request, res: Response) => {
  const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!token) {
    res.status(400).json({ error: 'Password reset token is required' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    const tokenHash = hashResetToken(token);
    await prisma.$transaction(async (transaction) => {
      const resetToken = await transaction.passwordResetToken.findUnique({ where: { tokenHash } });
      if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
        throw invalidResetToken();
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await transaction.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } });
      await transaction.passwordResetToken.delete({ where: { id: resetToken.id } });
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_RESET_TOKEN') {
      res.status(400).json({ error: 'This password reset link is invalid or has expired' });
      return;
    }
    console.error('Reset password error:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'Unable to reset password. Please try again later.' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, bio: true, skills: true, avatar: true, rating: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/logout', authenticate, (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
