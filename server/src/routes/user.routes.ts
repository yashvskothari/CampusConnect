import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';
import { authenticate } from '../middleware/auth.middleware';
import { getParam } from '../utils/params';

const router = Router();

/*
 * Profile picture upload configuration
 */
const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },

  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    const filename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

    cb(null, filename);
  },
});

const upload = multer({
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
    } else {
      cb(new Error('Only JPG, PNG and WEBP images are allowed'));
    }
  },
});


/*
 * GET ALL USERS
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, role } = req.query;

    const users = await prisma.user.findMany({
      where: {
        ...(search
          ? {
              name: {
                contains: String(search),
                mode: 'insensitive',
              },
            }
          : {}),

        ...(role ? { role: role as any } : {}),
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
  } catch {
    res.status(500).json({
      error: 'Failed to fetch users',
    });
  }
});


/*
 * GET USER BY ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = getParam(req.params.id);

    const user = await prisma.user.findUnique({
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
  } catch {
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
router.delete(
  '/me',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const password =
        typeof req.body?.password === 'string'
          ? req.body.password
          : '';

      if (!password) {
        res.status(400).json({
          error: 'Password is required to delete your account',
        });

        return;
      }

      const user = await prisma.user.findUnique({
        where: {
          id: req.user!.userId,
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

      const passwordMatches = await bcrypt.compare(
        password,
        user.password
      );

      if (!passwordMatches) {
        res.status(403).json({
          error: 'Incorrect password',
        });

        return;
      }

      await prisma.user.delete({
        where: {
          id: user.id,
        },
      });

      res.json({
        message: 'Account deleted successfully',
      });
    } catch (error) {
      console.error(
        'Delete account error:',
        error instanceof Error
          ? error.message
          : 'Unknown error'
      );

      res.status(500).json({
        error:
          'Failed to delete account. Please try again later.',
      });
    }
  }
);


/*
 * CHANGE PASSWORD
 *
 * Requires the current password before allowing
 * the user to set a new password.
 */
router.put(
  '/me/password',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const currentPassword =
        typeof req.body?.currentPassword === 'string'
          ? req.body.currentPassword
          : '';

      const newPassword =
        typeof req.body?.newPassword === 'string'
          ? req.body.newPassword
          : '';

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          error:
            'Current password and new password are required',
        });

        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          error:
            'New password must be at least 6 characters long',
        });

        return;
      }

      const user = await prisma.user.findUnique({
        where: {
          id: req.user!.userId,
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

      const passwordMatches = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordMatches) {
        res.status(403).json({
          error: 'Current password is incorrect',
        });

        return;
      }

      const hashedPassword = await bcrypt.hash(
        newPassword,
        10
      );

      await prisma.user.update({
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
    } catch (error) {
      console.error(
        'Change password error:',
        error instanceof Error
          ? error.message
          : 'Unknown error'
      );

      res.status(500).json({
        error:
          'Failed to change password. Please try again later.',
      });
    }
  }
);


/*
 * UPLOAD / CHANGE PROFILE PICTURE
 */
router.post(
  '/me/avatar',
  authenticate,
  upload.single('avatar'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'Profile picture is required',
        });

        return;
      }

      const user = await prisma.user.findUnique({
        where: {
          id: req.user!.userId,
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
        const oldAvatarPath = path.join(
          process.cwd(),
          user.avatar.replace(/^\/+/, '')
        );

        if (fs.existsSync(oldAvatarPath)) {
          try {
            fs.unlinkSync(oldAvatarPath);
          } catch {
            // Ignore failure to delete old avatar.
          }
        }
      }

      const avatarUrl = `/uploads/${req.file.filename}`;

      const updatedUser = await prisma.user.update({
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
    } catch (error) {
      /*
       * If database update fails after upload,
       * remove the newly uploaded file.
       */
      if (req.file) {
        const uploadedFilePath = path.join(
          uploadsDir,
          req.file.filename
        );

        if (fs.existsSync(uploadedFilePath)) {
          try {
            fs.unlinkSync(uploadedFilePath);
          } catch {
            // Ignore cleanup failure.
          }
        }
      }

      console.error(
        'Upload avatar error:',
        error instanceof Error
          ? error.message
          : 'Unknown error'
      );

      res.status(500).json({
        error:
          'Failed to upload profile picture. Please try again later.',
      });
    }
  }
);


/*
 * REMOVE PROFILE PICTURE
 */
router.delete(
  '/me/avatar',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user!.userId,
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
        const avatarPath = path.join(
          process.cwd(),
          user.avatar.replace(/^\/+/, '')
        );

        if (fs.existsSync(avatarPath)) {
          try {
            fs.unlinkSync(avatarPath);
          } catch {
            // Ignore file deletion failure.
          }
        }
      }

      const updatedUser = await prisma.user.update({
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
    } catch (error) {
      console.error(
        'Remove avatar error:',
        error instanceof Error
          ? error.message
          : 'Unknown error'
      );

      res.status(500).json({
        error:
          'Failed to remove profile picture. Please try again later.',
      });
    }
  }
);


/*
 * UPDATE USER PROFILE
 *
 * Used for:
 * - Name / username
 * - Bio
 * - Skills
 * - Avatar URL (kept for compatibility)
 */
router.put(
  '/:id',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const id = getParam(req.params.id);

      if (
        req.user!.userId !== id &&
        req.user!.role !== 'ADMIN'
      ) {
        res.status(403).json({
          error: 'Not authorized',
        });

        return;
      }

      const { name, bio, skills, avatar } = req.body;

      const user = await prisma.user.update({
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
    } catch (error) {
      console.error(
        'Update user error:',
        error instanceof Error
          ? error.message
          : 'Unknown error'
      );

      res.status(500).json({
        error: 'Failed to update user',
      });
    }
  }
);


export default router;