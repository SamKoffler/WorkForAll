import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { notificationService } from '../services/notifications.js';

const router = Router();

// Create a review
router.post(
    '/',
    authenticate,
    [
        body('subjectId').notEmpty().withMessage('Subject ID is required'),
        body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
        body('jobId').notEmpty().withMessage('Job ID is required'),
    ],
    async (req: AuthRequest, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError(errors.array()[0].msg, 400);
            }

            const { subjectId, rating, comment, jobId } = req.body;

            // Get the job to determine review type
            const job = await prisma.job.findUnique({
                where: { id: jobId },
            });

            if (!job) {
                throw new AppError('Job not found', 404);
            }

            // Check if there's a completed application for this job
            const application = await prisma.jobApplication.findFirst({
                where: {
                    jobId,
                    OR: [
                        { workerId: req.user!.id },
                        { job: { employerId: req.user!.id } },
                    ],
                    status: 'COMPLETED',
                },
            });

            if (!application) {
                throw new AppError('You can only review after job completion', 400);
            }

            // Determine review type
            let reviewType: 'WORKER_TO_EMPLOYER' | 'EMPLOYER_TO_WORKER';

            if (job.employerId === req.user!.id) {
                // Employer reviewing worker
                reviewType = 'EMPLOYER_TO_WORKER';
                if (application.workerId !== subjectId) {
                    throw new AppError('Invalid review subject', 400);
                }
            } else {
                // Worker reviewing employer
                reviewType = 'WORKER_TO_EMPLOYER';
                if (job.employerId !== subjectId) {
                    throw new AppError('Invalid review subject', 400);
                }
            }

            // Check if review already exists
            const existingReview = await prisma.review.findUnique({
                where: {
                    authorId_subjectId_jobId: {
                        authorId: req.user!.id,
                        subjectId,
                        jobId,
                    },
                },
            });

            if (existingReview) {
                throw new AppError('You have already reviewed this person for this job', 400);
            }

            const review = await prisma.review.create({
                data: {
                    authorId: req.user!.id,
                    subjectId,
                    rating,
                    comment,
                    reviewType,
                    jobId,
                },
                include: {
                    author: {
                        select: { id: true, name: true, avatarUrl: true },
                    },
                    subject: {
                        select: { id: true, name: true },
                    },
                },
            });

            // Notify the reviewed person
            await notificationService.createNotification({
                userId: subjectId,
                type: 'REVIEW_RECEIVED',
                title: 'New Review',
                message: `${review.author.name} left you a ${rating}-star review`,
                data: { reviewId: review.id, jobId },
            });

            res.status(201).json({
                status: 'success',
                data: { review },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get reviews for a user
router.get('/user/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { type } = req.query;

        const where: any = { subjectId: userId };

        if (type === 'received') {
            where.subjectId = userId;
        } else if (type === 'given') {
            where.authorId = userId;
        }

        const reviews = await prisma.review.findMany({
            where,
            include: {
                author: {
                    select: { id: true, name: true, avatarUrl: true },
                },
                subject: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate stats
        const stats = await prisma.review.aggregate({
            where: { subjectId: userId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        // Rating distribution
        const distribution = await prisma.review.groupBy({
            by: ['rating'],
            where: { subjectId: userId },
            _count: { rating: true },
        });

        const ratingDistribution = {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
        };
        distribution.forEach(d => {
            ratingDistribution[d.rating as keyof typeof ratingDistribution] = d._count.rating;
        });

        res.json({
            status: 'success',
            data: {
                reviews,
                stats: {
                    averageRating: stats._avg.rating || 0,
                    totalReviews: stats._count.rating,
                    ratingDistribution,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Check if user can review another user for a specific job
router.get('/can-review', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { subjectId, jobId } = req.query;

        if (!subjectId || !jobId) {
            throw new AppError('Subject ID and Job ID are required', 400);
        }

        // Check if there's a completed application
        const application = await prisma.jobApplication.findFirst({
            where: {
                jobId: jobId as string,
                status: 'COMPLETED',
                OR: [
                    { workerId: req.user!.id },
                    { job: { employerId: req.user!.id } },
                ],
            },
        });

        if (!application) {
            return res.json({
                status: 'success',
                data: { canReview: false, reason: 'Job not completed' },
            });
        }

        // Check if already reviewed
        const existingReview = await prisma.review.findUnique({
            where: {
                authorId_subjectId_jobId: {
                    authorId: req.user!.id,
                    subjectId: subjectId as string,
                    jobId: jobId as string,
                },
            },
        });

        if (existingReview) {
            return res.json({
                status: 'success',
                data: { canReview: false, reason: 'Already reviewed' },
            });
        }

        res.json({
            status: 'success',
            data: { canReview: true },
        });
    } catch (error) {
        next(error);
    }
});

export { router as reviewsRouter };
