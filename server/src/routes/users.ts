import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get user profile by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                skills: true,
                reviewsReceived: {
                    include: {
                        author: {
                            select: { id: true, name: true, avatarUrl: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        jobsPosted: true,
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

        // Count completed jobs
        const completedApplications = await prisma.jobApplication.count({
            where: {
                workerId: user.id,
                status: 'COMPLETED',
            },
        });

        res.json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    userType: user.userType,
                    city: user.city,
                    bio: user.bio,
                    avatarUrl: user.avatarUrl,
                    skills: user.skills,
                    hasTransportation: user.hasTransportation,
                    isVerified: user.isVerified,
                    createdAt: user.createdAt,
                    reviews: user.reviewsReceived,
                    averageRating: avgRating._avg.rating || null,
                    reviewCount: user._count.reviewsReceived,
                    jobsPosted: user._count.jobsPosted,
                    jobsCompleted: completedApplications,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Update user profile
router.patch(
    '/profile',
    authenticate,
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Invalid email'),
        body('phone').optional(),
        body('bio').optional().isLength({ max: 500 }).withMessage('Bio too long'),
    ],
    async (req: AuthRequest, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError(errors.array()[0].msg, 400);
            }

            const {
                name,
                email,
                phone,
                bio,
                hasTransportation,
                needsTransportation,
                latitude,
                longitude,
                city,
                zipCode,
                skillIds,
            } = req.body;

            // Check email uniqueness
            if (email) {
                const existingUser = await prisma.user.findFirst({
                    where: {
                        email,
                        NOT: { id: req.user!.id },
                    },
                });
                if (existingUser) {
                    throw new AppError('Email already in use', 400);
                }
            }

            const updateData: any = {};

            if (name !== undefined) updateData.name = name;
            if (email !== undefined) updateData.email = email;
            if (phone !== undefined) updateData.phone = phone;
            if (bio !== undefined) updateData.bio = bio;
            if (hasTransportation !== undefined) updateData.hasTransportation = hasTransportation;
            if (needsTransportation !== undefined) updateData.needsTransportation = needsTransportation;
            if (latitude !== undefined) updateData.latitude = latitude;
            if (longitude !== undefined) updateData.longitude = longitude;
            if (city !== undefined) updateData.city = city;
            if (zipCode !== undefined) updateData.zipCode = zipCode;

            if (skillIds !== undefined) {
                updateData.skills = {
                    set: skillIds.map((id: string) => ({ id })),
                };
            }

            const user = await prisma.user.update({
                where: { id: req.user!.id },
                data: updateData,
                include: {
                    skills: true,
                },
            });

            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        bio: user.bio,
                        userType: user.userType,
                        skills: user.skills,
                        hasTransportation: user.hasTransportation,
                        needsTransportation: user.needsTransportation,
                        city: user.city,
                        zipCode: user.zipCode,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Update location
router.patch('/location', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { latitude, longitude, city, zipCode } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                latitude,
                longitude,
                city,
                zipCode,
            },
        });

        res.json({
            status: 'success',
            data: {
                location: {
                    latitude: user.latitude,
                    longitude: user.longitude,
                    city: user.city,
                    zipCode: user.zipCode,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

export { router as usersRouter };
