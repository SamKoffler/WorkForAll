import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { notificationService } from '../services/notifications.js';

const router = Router();

// Apply to a job
router.post(
    '/',
    authenticate,
    [
        body('jobId').notEmpty().withMessage('Job ID is required'),
    ],
    async (req: AuthRequest, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError(errors.array()[0].msg, 400);
            }

            const { jobId, coverNote } = req.body;

            // Check if job exists and is open
            const job = await prisma.job.findUnique({
                where: { id: jobId },
                include: { employer: true },
            });

            if (!job) {
                throw new AppError('Job not found', 404);
            }

            if (job.status !== 'OPEN') {
                throw new AppError('This job is no longer accepting applications', 400);
            }

            if (job.employerId === req.user!.id) {
                throw new AppError('You cannot apply to your own job', 400);
            }

            // Check if already applied
            const existingApplication = await prisma.jobApplication.findUnique({
                where: {
                    jobId_workerId: {
                        jobId,
                        workerId: req.user!.id,
                    },
                },
            });

            if (existingApplication) {
                throw new AppError('You have already applied to this job', 400);
            }

            // Create application
            const application = await prisma.jobApplication.create({
                data: {
                    jobId,
                    workerId: req.user!.id,
                    coverNote,
                },
                include: {
                    job: {
                        select: { title: true, employerId: true },
                    },
                    worker: {
                        select: { id: true, name: true },
                    },
                },
            });

            // Notify employer
            await notificationService.createNotification({
                userId: job.employerId,
                type: 'APPLICATION_RECEIVED',
                title: 'New Application',
                message: `${application.worker.name} applied for "${job.title}"`,
                data: { applicationId: application.id, jobId: job.id },
            });

            res.status(201).json({
                status: 'success',
                data: { application },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get worker's applications
router.get('/my-applications', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const applications = await prisma.jobApplication.findMany({
            where: { workerId: req.user!.id },
            include: {
                job: {
                    include: {
                        employer: {
                            select: { id: true, name: true, avatarUrl: true },
                        },
                        skills: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            status: 'success',
            data: { applications },
        });
    } catch (error) {
        next(error);
    }
});

// Get applications for a job (employer only)
router.get('/job/:jobId', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { jobId } = req.params;

        const job = await prisma.job.findUnique({
            where: { id: jobId },
        });

        if (!job) {
            throw new AppError('Job not found', 404);
        }

        if (job.employerId !== req.user!.id) {
            throw new AppError('Not authorized to view these applications', 403);
        }

        const applications = await prisma.jobApplication.findMany({
            where: { jobId },
            include: {
                worker: {
                    include: {
                        skills: true,
                        reviewsReceived: {
                            select: { rating: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate worker ratings
        const applicationsWithRatings = applications.map(app => {
            const ratings = app.worker.reviewsReceived.map(r => r.rating);
            const avgRating = ratings.length > 0
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : null;

            return {
                ...app,
                worker: {
                    ...app.worker,
                    averageRating: avgRating,
                    reviewCount: ratings.length,
                    reviewsReceived: undefined,
                },
            };
        });

        res.json({
            status: 'success',
            data: { applications: applicationsWithRatings },
        });
    } catch (error) {
        next(error);
    }
});

// Update application status (employer only)
router.patch('/:id/status', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            throw new AppError('Invalid status', 400);
        }

        const application = await prisma.jobApplication.findUnique({
            where: { id },
            include: {
                job: true,
                worker: true,
            },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        if (application.job.employerId !== req.user!.id) {
            throw new AppError('Not authorized to update this application', 403);
        }

        // Update application
        const updatedApplication = await prisma.jobApplication.update({
            where: { id },
            data: { status },
            include: {
                job: { select: { title: true } },
                worker: { select: { id: true, name: true } },
            },
        });

        // If accepted, update job's hired count
        if (status === 'ACCEPTED') {
            await prisma.job.update({
                where: { id: application.jobId },
                data: {
                    workersHired: { increment: 1 },
                },
            });

            // Check if job is now filled
            const job = await prisma.job.findUnique({
                where: { id: application.jobId },
            });

            if (job && job.workersHired >= job.workersNeeded) {
                await prisma.job.update({
                    where: { id: application.jobId },
                    data: { status: 'FILLED' },
                });
            }

            // Create conversation for messaging
            const existingConversation = await prisma.conversation.findFirst({
                where: {
                    jobId: application.jobId,
                    participants: {
                        every: {
                            userId: { in: [req.user!.id, application.workerId] },
                        },
                    },
                },
            });

            if (!existingConversation) {
                await prisma.conversation.create({
                    data: {
                        jobId: application.jobId,
                        participants: {
                            create: [
                                { userId: req.user!.id },
                                { userId: application.workerId },
                            ],
                        },
                    },
                });
            }
        }

        // Notify worker
        await notificationService.createNotification({
            userId: application.workerId,
            type: status === 'ACCEPTED' ? 'APPLICATION_ACCEPTED' : 'APPLICATION_REJECTED',
            title: status === 'ACCEPTED' ? 'Application Accepted!' : 'Application Update',
            message: status === 'ACCEPTED'
                ? `Your application for "${application.job.title}" has been accepted!`
                : `Your application for "${application.job.title}" was not accepted.`,
            data: { applicationId: id, jobId: application.jobId },
        });

        res.json({
            status: 'success',
            data: { application: updatedApplication },
        });
    } catch (error) {
        next(error);
    }
});

// Withdraw application (worker only)
router.patch('/:id/withdraw', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        const application = await prisma.jobApplication.findUnique({
            where: { id },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        if (application.workerId !== req.user!.id) {
            throw new AppError('Not authorized to withdraw this application', 403);
        }

        if (application.status !== 'PENDING') {
            throw new AppError('Can only withdraw pending applications', 400);
        }

        const updatedApplication = await prisma.jobApplication.update({
            where: { id },
            data: { status: 'WITHDRAWN' },
        });

        res.json({
            status: 'success',
            data: { application: updatedApplication },
        });
    } catch (error) {
        next(error);
    }
});

// Mark application as completed
router.patch('/:id/complete', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        const application = await prisma.jobApplication.findUnique({
            where: { id },
            include: { job: true },
        });

        if (!application) {
            throw new AppError('Application not found', 404);
        }

        if (application.job.employerId !== req.user!.id) {
            throw new AppError('Not authorized to complete this application', 403);
        }

        if (application.status !== 'ACCEPTED') {
            throw new AppError('Can only complete accepted applications', 400);
        }

        const updatedApplication = await prisma.jobApplication.update({
            where: { id },
            data: { status: 'COMPLETED' },
            include: {
                job: { select: { title: true } },
                worker: { select: { id: true, name: true } },
            },
        });

        // Update job status if all workers completed
        const completedCount = await prisma.jobApplication.count({
            where: {
                jobId: application.jobId,
                status: 'COMPLETED',
            },
        });

        if (completedCount >= application.job.workersNeeded) {
            await prisma.job.update({
                where: { id: application.jobId },
                data: { status: 'COMPLETED' },
            });
        }

        // Notify worker to leave review
        await notificationService.createNotification({
            userId: application.workerId,
            type: 'JOB_COMPLETED',
            title: 'Job Completed!',
            message: `The job "${application.job.title}" has been marked as completed. Don't forget to leave a review!`,
            data: { applicationId: id, jobId: application.jobId },
        });

        res.json({
            status: 'success',
            data: { application: updatedApplication },
        });
    } catch (error) {
        next(error);
    }
});

export { router as applicationsRouter };
