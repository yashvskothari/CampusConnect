"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const jwt_1 = require("../utils/jwt");
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyToken)(token);
        const dbUser = await prisma_1.default.user.findUnique({
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
    }
    catch {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
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
exports.authorize = authorize;
