import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Generate JWT token
const generateToken = (payload: object): string => {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// Create guest session (no account required)
router.post('/guest-session', async (req, res, next) => {
    try {
        const { userType, latitude, longitude, city, zipCode } = req.body;

        const sessionToken = uuidv4();

        const user = await prisma.user.create({
            data: {
                name: 'Guest User',
                userType: userType || 'WORKER',
                sessionToken,
                latitude,
                longitude,
                city,
                zipCode,
            },
        });

        const token = generateToken({ userId: user.id, sessionToken });

        res.status(201).json({
            status: 'success',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    userType: user.userType,
                    isGuest: true,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Register new user
router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').optional().isEmail().withMessage('Invalid email'),
        body('phone').optional().isMobilePhone('any').withMessage('Invalid phone'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('userType').isIn(['WORKER', 'EMPLOYER', 'BOTH']).withMessage('Invalid user type'),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError(errors.array()[0].msg, 400);
            }

            const { name, email, phone, password, userType, latitude, longitude, city, zipCode, sessionToken } = req.body;

            // Check if email already exists
            if (email) {
                const existingUser = await prisma.user.findUnique({ where: { email } });
                if (existingUser) {
                    throw new AppError('Email already registered', 400);
                }
            }

            // Require phone for employers
            if (userType === 'EMPLOYER' && !phone) {
                throw new AppError('Phone number is required for employers', 400);
            }

            let passwordHash = null;
            if (password) {
                passwordHash = await bcrypt.hash(password, 12);
            }

            let user;

            // If upgrading from guest session
            if (sessionToken) {
                user = await prisma.user.update({
                    where: { sessionToken },
                    data: {
                        name,
                        email,
                        phone,
                        passwordHash,
                        userType,
                        latitude,
                        longitude,
                        city,
                        zipCode,
                        sessionToken: null, // Clear session token on registration
                    },
                });
            } else {
                user = await prisma.user.create({
                    data: {
                        name,
                        email,
                        phone,
                        passwordHash,
                        userType,
                        latitude,
                        longitude,
                        city,
                        zipCode,
                    },
                });
            }

            const token = generateToken({ userId: user.id });

            res.status(201).json({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        userType: user.userType,
                        isGuest: false,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Login
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Invalid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError(errors.array()[0].msg, 400);
            }

            const { email, password } = req.body;

            const user = await prisma.user.findUnique({
                where: { email },
                include: {
                    skills: true,
                },
            });

            if (!user || !user.passwordHash) {
                throw new AppError('Invalid email or password', 401);
            }

            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            if (!isValidPassword) {
                throw new AppError('Invalid email or password', 401);
            }

            // Update last active
            await prisma.user.update({
                where: { id: user.id },
                data: { lastActiveAt: new Date() },
            });

            const token = generateToken({ userId: user.id });

            res.json({
                status: 'success',
                data: {
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        userType: user.userType,
                        skills: user.skills,
                        hasTransportation: user.hasTransportation,
                        needsTransportation: user.needsTransportation,
                        city: user.city,
                        isGuest: false,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                skills: true,
                reviewsReceived: {
                    include: {
                        author: {
                            select: { id: true, name: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
                _count: {
                    select: {
                        jobsPosted: true,
                        applications: true,
                        reviewsReceived: true,
                    },
                },
            },
        });

        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Calculate average rating
        const avgRating = await prisma.review.aggregate({
            where: { subjectId: user.id },
            _avg: { rating: true },
        });

        res.json({
            status: 'success',
            data: {
                user: {
                    ...user,
                    passwordHash: undefined,
                    averageRating: avgRating._avg.rating || null,
                    isGuest: !!user.sessionToken,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Logout (invalidate session token for guests)
router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
    try {
        if (req.sessionToken) {
            // Guest user - delete the user
            await prisma.user.delete({
                where: { sessionToken: req.sessionToken },
            });
        }

        res.json({
            status: 'success',
            message: 'Logged out successfully',
        });
    } catch (error) {
        next(error);
    }
});

export { router as authRouter };
