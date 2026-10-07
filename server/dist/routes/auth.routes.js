"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const jwt_1 = require("../utils/jwt");
const auth_middleware_1 = require("../middleware/auth.middleware");
const password_reset_limiter_service_1 = require("../services/password-reset-limiter.service");
const email_service_1 = require("../services/email.service");
const router = (0, express_1.Router)();
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const PASSWORD_RESET_MESSAGE = 'If an account exists with this email, you will receive a password reset link.';
const invalidResetToken = () => new Error('INVALID_RESET_TOKEN');
const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';
const hashResetToken = (token) => crypto_1.default.createHash('sha256').update(token).digest('hex');
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, role, bio, skills } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: 'Name, email, and password are required' });
            return;
        }
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }
        const validRoles = ['FREELANCER', 'CLIENT', 'ADMIN'];
        const userRole = validRoles.includes(role) ? role : 'FREELANCER';
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
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
        const token = (0, jwt_1.signToken)({ userId: user.id, email: user.email, role: user.role });
        res.status(201).json({ user, token });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Failed to create account' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const token = (0, jwt_1.signToken)({ userId: user.id, email: user.email, role: user.role });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, token });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
router.post('/forgot-password', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        res.status(400).json({ error: 'Enter a valid email address' });
        return;
    }
    try {
        const rateLimit = await (0, password_reset_limiter_service_1.checkPasswordResetRateLimit)(email, ip);
        if (!rateLimit.allowed) {
            res.status(429).json({
                error: 'Too many password reset requests. Please try again later.',
                retryAfterSeconds: rateLimit.retryAfterSeconds,
            });
            return;
        }
        // Record the attempt up front (before we know if the account exists) so
        // that probing many emails from one IP, or hammering one email, always
        // counts against the limit — never bypassable by choice of address.
        await (0, password_reset_limiter_service_1.recordPasswordResetAttempt)(email, ip);
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.json({ message: PASSWORD_RESET_MESSAGE });
            return;
        }
        const rawToken = crypto_1.default.randomBytes(32).toString('hex');
        const tokenHash = hashResetToken(rawToken);
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
        const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL;
        if (!frontendUrl) {
            throw new Error('FRONTEND_URL is not configured');
        }
        const resetUrl = new URL('/reset-password', frontendUrl);
        resetUrl.searchParams.set('token', rawToken);
        await prisma_1.default.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await prisma_1.default.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt } });
        try {
            await (0, email_service_1.sendPasswordResetEmail)({ recipient: user.email, recipientName: user.name, resetUrl: resetUrl.toString() });
        }
        catch (error) {
            await prisma_1.default.passwordResetToken.deleteMany({ where: { tokenHash } });
            console.error('Password reset email error:', error instanceof Error ? error.message : 'Unknown email error');
        }
        res.json({ message: PASSWORD_RESET_MESSAGE });
    }
    catch (error) {
        console.error('Forgot password error:', error instanceof Error ? error.message : 'Unknown error');
        res.json({ message: PASSWORD_RESET_MESSAGE });
    }
});
router.post('/reset-password', async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!token) {
        res.status(400).json({ error: 'Password reset token is required' });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
    }
    try {
        const submitLimit = await (0, password_reset_limiter_service_1.checkResetSubmitRateLimit)(ip);
        if (!submitLimit.allowed) {
            res.status(429).json({ error: 'Too many attempts. Please try again later.' });
            return;
        }
        await (0, password_reset_limiter_service_1.recordResetSubmitAttempt)(ip);
        const tokenHash = hashResetToken(token);
        await prisma_1.default.$transaction(async (transaction) => {
            const resetToken = await transaction.passwordResetToken.findUnique({ where: { tokenHash } });
            if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
                throw invalidResetToken();
            }
            const hashedPassword = await bcryptjs_1.default.hash(password, 10);
            await transaction.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } });
            await transaction.passwordResetToken.delete({ where: { id: resetToken.id } });
        });
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        if (error instanceof Error && error.message === 'INVALID_RESET_TOKEN') {
            res.status(400).json({ error: 'This password reset link is invalid or has expired' });
            return;
        }
        console.error('Reset password error:', error instanceof Error ? error.message : 'Unknown error');
        res.status(500).json({ error: 'Unable to reset password. Please try again later.' });
    }
});
router.get('/me', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true, role: true, bio: true, skills: true, avatar: true, rating: true, createdAt: true },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
router.post('/logout', auth_middleware_1.authenticate, (_req, res) => {
    res.json({ message: 'Logged out successfully' });
});
exports.default = router;
