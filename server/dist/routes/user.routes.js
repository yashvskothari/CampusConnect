"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const params_1 = require("../utils/params");
const router = (0, express_1.Router)();
/*
 * Profile picture upload configuration
 */
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const extension = path_1.default.extname(file.originalname);
        const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
        cb(null, filename);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Only JPG, PNG and WEBP images are allowed'));
        }
    },
});
/*
 * GET ALL USERS
 */
router.get('/', async (req, res) => {
    try {
        const { search, role } = req.query;
        const users = await prisma_1.default.user.findMany({
            where: {
                ...(search
                    ? {
                        name: {
                            contains: String(search),
                            mode: 'insensitive',
                        },
                    }
                    : {}),
                ...(role ? { role: role } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                bio: true,
                skills: true,
                avatar: true,
                rating: true,
                createdAt: true,
            },
            take: 50,
        });
        res.json(users);
    }
    catch {
        res.status(500).json({
            error: 'Failed to fetch users',
        });
    }
});
/*
 * GET USER BY ID
 */
router.get('/:id', async (req, res) => {
    try {
        const id = (0, params_1.getParam)(req.params.id);
        const user = await prisma_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                bio: true,
                skills: true,
                avatar: true,
                rating: true,
                createdAt: true,
                services: true,
                reviewsReceived: {
                    include: {
                        reviewer: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        });
        if (!user) {
            res.status(404).json({
                error: 'User not found',
            });
            return;
        }
        res.json(user);
    }
    catch {
        res.status(500).json({
            error: 'Failed to fetch user',
        });
    }
});
/*
 * DELETE ACCOUNT PERMANENTLY
 *
 * Requires current password.
 */
router.delete('/me', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const password = typeof req.body?.password === 'string'
            ? req.body.password
            : '';
        if (!password) {
            res.status(400).json({
                error: 'Password is required to delete your account',
            });
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: {
                id: req.user.userId,
            },
            select: {
                id: true,
                password: true,
            },
        });
        if (!user) {
            res.status(404).json({
                error: 'User not found',
            });
            return;
        }
        const passwordMatches = await bcryptjs_1.default.compare(password, user.password);
        if (!passwordMatches) {
            res.status(403).json({
                error: 'Incorrect password',
            });
            return;
        }
        await prisma_1.default.user.delete({
            where: {
                id: user.id,
            },
        });
        res.json({
            message: 'Account deleted successfully',
        });
    }
    catch (error) {
        console.error('Delete account error:', error instanceof Error
            ? error.message
            : 'Unknown error');
        res.status(500).json({
            error: 'Failed to delete account. Please try again later.',
        });
    }
});
/*
 * CHANGE PASSWORD
 *
 * Requires the current password before allowing
 * the user to set a new password.
 */
router.put('/me/password', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const currentPassword = typeof req.body?.currentPassword === 'string'
            ? req.body.currentPassword
            : '';
        const newPassword = typeof req.body?.newPassword === 'string'
            ? req.body.newPassword
            : '';
        if (!currentPassword || !newPassword) {
            res.status(400).json({
                error: 'Current password and new password are required',
            });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({
                error: 'New password must be at least 6 characters long',
            });
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: {
                id: req.user.userId,
            },
            select: {
                id: true,
                password: true,
            },
        });
        if (!user) {
            res.status(404).json({
                error: 'User not found',
            });
            return;
        }
        const passwordMatches = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!passwordMatches) {
            res.status(403).json({
                error: 'Current password is incorrect',
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 10);
        await prisma_1.default.user.update({
            where: {
                id: user.id,
            },
            data: {
                password: hashedPassword,
            },
        });
        res.json({
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        console.error('Change password error:', error instanceof Error
            ? error.message
            : 'Unknown error');
        res.status(500).json({
            error: 'Failed to change password. Please try again later.',
        });
    }
});
/*
 * UPLOAD / CHANGE PROFILE PICTURE
 */
router.post('/me/avatar', auth_middleware_1.authenticate, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({
                error: 'Profile picture is required',
            });
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: {
                id: req.user.userId,
            },
            select: {
                id: true,
                avatar: true,
            },
        });
        if (!user) {
            res.status(404).json({
                error: 'User not found',
            });
            return;
        }
        /*
         * Delete previous local avatar if it exists.
         */
        if (user.avatar) {
            const oldAvatarPath = path_1.default.join(process.cwd(), user.avatar.replace(/^\/+/, ''));
            if (fs_1.default.existsSync(oldAvatarPath)) {
                try {
                    fs_1.default.unlinkSync(oldAvatarPath);
                }
                catch {
                    // Ignore failure to delete old avatar.
                }
            }
        }
        const avatarUrl = `/uploads/${req.file.filename}`;
        const updatedUser = await prisma_1.default.user.update({
            where: {
                id: user.id,
            },
            data: {
                avatar: avatarUrl,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                bio: true,
                skills: true,
                avatar: true,
                rating: true,
                createdAt: true,
            },
        });
        res.json(updatedUser);
    }
    catch (error) {
        /*
         * If database update fails after upload,
         * remove the newly uploaded file.
         */
        if (req.file) {
            const uploadedFilePath = path_1.default.join(uploadsDir, req.file.filename);
            if (fs_1.default.existsSync(uploadedFilePath)) {
                try {
                    fs_1.default.unlinkSync(uploadedFilePath);
                }
                catch {
                    // Ignore cleanup failure.
                }
            }
        }
        console.error('Upload avatar error:', error instanceof Error
            ? error.message
            : 'Unknown error');
        res.status(500).json({
            error: 'Failed to upload profile picture. Please try again later.',
        });
    }
});
/*
 * REMOVE PROFILE PICTURE
 */
router.delete('/me/avatar', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: {
                id: req.user.userId,
            },
            select: {
                id: true,
                avatar: true,
            },
        });
        if (!user) {
            res.status(404).json({
                error: 'User not found',
            });
            return;
        }
        /*
         * Delete the physical image from uploads.
         */
        if (user.avatar) {
            const avatarPath = path_1.default.join(process.cwd(), user.avatar.replace(/^\/+/, ''));
            if (fs_1.default.existsSync(avatarPath)) {
                try {
                    fs_1.default.unlinkSync(avatarPath);
                }
                catch {
                    // Ignore file deletion failure.
                }
            }
        }
        const updatedUser = await prisma_1.default.user.update({
            where: {
                id: user.id,
            },
            data: {
                avatar: null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                bio: true,
                skills: true,
                avatar: true,
                rating: true,
                createdAt: true,
            },
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Remove avatar error:', error instanceof Error
            ? error.message
            : 'Unknown error');
        res.status(500).json({
            error: 'Failed to remove profile picture. Please try again later.',
        });
    }
});
/*
 * UPDATE USER PROFILE
 *
 * Used for:
 * - Name / username
 * - Bio
 * - Skills
 * - Avatar URL (kept for compatibility)
 */
router.put('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const id = (0, params_1.getParam)(req.params.id);
        if (req.user.userId !== id &&
            req.user.role !== 'ADMIN') {
            res.status(403).json({
                error: 'Not authorized',
            });
            return;
        }
        const { name, bio, skills, avatar } = req.body;
        const user = await prisma_1.default.user.update({
            where: {
                id,
            },
            data: {
                ...(typeof name === 'string' &&
                    name.trim() && {
                    name: name.trim(),
                }),
                ...(bio !== undefined && {
                    bio,
                }),
                ...(skills !== undefined && {
                    skills,
                }),
                ...(avatar !== undefined && {
                    avatar,
                }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                bio: true,
                skills: true,
                avatar: true,
                rating: true,
                createdAt: true,
            },
        });
        res.json(user);
    }
    catch (error) {
        console.error('Update user error:', error instanceof Error
            ? error.message
            : 'Unknown error');
        res.status(500).json({
            error: 'Failed to update user',
        });
    }
});
exports.default = router;
