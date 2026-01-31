import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth.js';
import { calculateJobScore } from '../services/matching.js';
import { notificationService } from '../services/notifications.js';

const router = Router();

// Get all jobs with filtering and matching
router.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
    try {
        const {
            latitude,
            longitude,
            city,
            zipCode,
            skillIds,
            providesTransportation,
            status = 'OPEN',
            page = '1',
            limit = '20',
            sortBy = 'match', // 'match', 'date', 'pay', 'distance'
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: any = {
            status: status as string,
        };

        if (city) {
            where.city = { contains: city as string, mode: 'insensitive' };
        }

        if (zipCode) {
            where.zipCode = zipCode;
        }

        if (providesTransportation === 'true') {
            where.providesTransportation = true;
        }

        if (skillIds) {
            const skillIdArray = (skillIds as string).split(',');
            where.skills = {
                some: {
                    id: { in: skillIdArray },
                },
            };
        }

        // Get jobs
        let jobs = await prisma.job.findMany({
            where,
            include: {
                employer: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        isVerified: true,
                    },
                },
                skills: true,
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Get employer ratings
        const employerIds = [...new Set(jobs.map(j => j.employerId))];
        const employerRatings = await prisma.review.groupBy({
            by: ['subjectId'],
            where: { subjectId: { in: employerIds } },
            _avg: { rating: true },
            _count: { rating: true },
        });

        const ratingsMap = new Map(
            employerRatings.map(r => [r.subjectId, { avg: r._avg.rating, count: r._count.rating }])
        );

        // If user is authenticated and has a profile, calculate match scores
        let userSkillIds: string[] = [];
        let userLat: number | null = null;
        let userLng: number | null = null;
        let userNeedsTransport = false;

        if (req.user) {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: { skills: true },
            });

            if (user) {
                userSkillIds = user.skills.map(s => s.id);
                userLat = user.latitude;
                userLng = user.longitude;
                userNeedsTransport = user.needsTransportation;
            }
        }

        // Use query params for location if user location not available
        if (!userLat && latitude) userLat = parseFloat(latitude as string);
        if (!userLng && longitude) userLng = parseFloat(longitude as string);

        // Calculate scores and sort
        const jobsWithScores = jobs.map(job => {
            const score = calculateJobScore(job, {
                userSkillIds,
                userLatitude: userLat,
                userLongitude: userLng,
                userNeedsTransportation: userNeedsTransport,
            });

            const employerRating = ratingsMap.get(job.employerId);

            return {
                ...job,
                matchScore: score,
                employerRating: employerRating?.avg || null,
                employerReviewCount: employerRating?.count || 0,
            };
        });

        // Sort based on sortBy parameter
        if (sortBy === 'match') {
            jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);
        } else if (sortBy === 'date') {
            jobsWithScores.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        } else if (sortBy === 'pay') {
            jobsWithScores.sort((a, b) => b.payAmount - a.payAmount);
        } else if (sortBy === 'distance' && userLat && userLng) {
            jobsWithScores.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.latitude - userLat!, 2) + Math.pow(a.longitude - userLng!, 2));
                const distB = Math.sqrt(Math.pow(b.latitude - userLat!, 2) + Math.pow(b.longitude - userLng!, 2));
                return distA - distB;
            });
        }

        // Paginate
        const paginatedJobs = jobsWithScores.slice(skip, skip + limitNum);
        const total = jobsWithScores.length;

        res.json({
            status: 'success',
            data: {
                jobs: paginatedJobs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Get single job
router.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        const job = await prisma.job.findUnique({
            where: { id },
            include: {
                employer: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                        phone: true,
                        isVerified: true,
                        city: true,
                        createdAt: true,
                    },
                },
                skills: true,
                applications: req.user ? {
                    where: { workerId: req.user.id },
                    select: { id: true, status: true },
                } : false,
                _count: {
                    select: { applications: true },
                },
            },
        });

        if (!job) {
            throw new AppError('Job not found', 404);
        }

        // Get employer rating
        const employerRating = await prisma.review.aggregate({
            where: { subjectId: job.employerId },
            _avg: { rating: true },
            _count: { rating: true },
        });

        res.json({
            status: 'success',
            data: {
                job: {
                    ...job,
                    employerRating: employerRating._avg.rating,
                    employerReviewCount: employerRating._count.rating,
                    hasApplied: job.applications && job.applications.length > 0,
                    applicationStatus: job.applications?.[0]?.status || null,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// Create job (employers only)
router.post(
    '/',
    authenticate,
    [
        body('title').trim().notEmpty().withMessage('Job title is required'),
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('payAmount').isFloat({ min: 0 }).withMessage('Pay amount must be positive'),
        body('payType').isIn(['HOURLY', 'DAILY', 'FIXED']).withMessage('Invalid pay type'),
        body('startDate').isISO8601().withMessage('Invalid start date'),
        body('latitude').isFloat().withMessage('Latitude is required'),
        body('longitude').isFloat().withMessage('Longitude is required'),
        body('city').trim().notEmpty().withMessage('City is required'),
        body('workersNeeded').isInt({ min: 1 }).withMessage('Workers needed must be at least 1'),
    ],
    async (req: AuthRequest, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError(errors.array()[0].msg, 400);
            }

            const user = await prisma.user.findUnique({
                where: { id: req.user!.id },
            });

            if (!user || (user.userType !== 'EMPLOYER' && user.userType !== 'BOTH')) {
                throw new AppError('Only employers can post jobs', 403);
            }

            const {
                title,
                description,
                payAmount,
                payType,
                durationHours,
                durationDays,
                startDate,
                endDate,
                startTime,
                latitude,
                longitude,
                address,
                city,
                zipCode,
                workersNeeded,
                providesTransportation,
                skillIds,
            } = req.body;

            const job = await prisma.job.create({
                data: {
                    title,
                    description,
                    payAmount,
                    payType,
                    durationHours,
                    durationDays,
                    startDate: new Date(startDate),
                    endDate: endDate ? new Date(endDate) : null,
                    startTime,
                    latitude,
                    longitude,
                    address,
                    city,
                    zipCode,
                    workersNeeded,
                    providesTransportation: providesTransportation || false,
                    employerId: req.user!.id,
                    skills: skillIds ? {
                        connect: skillIds.map((id: string) => ({ id })),
                    } : undefined,
                },
                include: {
                    skills: true,
                    employer: {
                        select: { id: true, name: true },
                    },
                },
            });

            // Trigger notifications for matching workers (Teli-ready)
            await notificationService.notifyMatchingWorkers(job);

            res.status(201).json({
                status: 'success',
                data: { job },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Update job
router.patch('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        const job = await prisma.job.findUnique({
            where: { id },
        });

        if (!job) {
            throw new AppError('Job not found', 404);
        }

        if (job.employerId !== req.user!.id) {
            throw new AppError('Not authorized to update this job', 403);
        }

        const {
            title,
            description,
            payAmount,
            payType,
            durationHours,
            durationDays,
            startDate,
            endDate,
            startTime,
            latitude,
            longitude,
            address,
            city,
            zipCode,
            workersNeeded,
            providesTransportation,
            skillIds,
            status,
        } = req.body;

        const updateData: any = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (payAmount !== undefined) updateData.payAmount = payAmount;
        if (payType !== undefined) updateData.payType = payType;
        if (durationHours !== undefined) updateData.durationHours = durationHours;
        if (durationDays !== undefined) updateData.durationDays = durationDays;
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = new Date(endDate);
        if (startTime !== undefined) updateData.startTime = startTime;
        if (latitude !== undefined) updateData.latitude = latitude;
        if (longitude !== undefined) updateData.longitude = longitude;
        if (address !== undefined) updateData.address = address;
        if (city !== undefined) updateData.city = city;
        if (zipCode !== undefined) updateData.zipCode = zipCode;
        if (workersNeeded !== undefined) updateData.workersNeeded = workersNeeded;
        if (providesTransportation !== undefined) updateData.providesTransportation = providesTransportation;
        if (status !== undefined) updateData.status = status;

        if (skillIds !== undefined) {
            updateData.skills = {
                set: skillIds.map((id: string) => ({ id })),
            };
        }

        const updatedJob = await prisma.job.update({
            where: { id },
            data: updateData,
            include: {
                skills: true,
                employer: {
                    select: { id: true, name: true },
                },
            },
        });

        res.json({
            status: 'success',
            data: { job: updatedJob },
        });
    } catch (error) {
        next(error);
    }
});

// Delete job
router.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        const job = await prisma.job.findUnique({
            where: { id },
        });

        if (!job) {
            throw new AppError('Job not found', 404);
        }

        if (job.employerId !== req.user!.id) {
            throw new AppError('Not authorized to delete this job', 403);
        }

        await prisma.job.delete({
            where: { id },
        });

        res.json({
            status: 'success',
            message: 'Job deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Get employer's jobs
router.get('/employer/my-jobs', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const jobs = await prisma.job.findMany({
            where: { employerId: req.user!.id },
            include: {
                skills: true,
                applications: {
                    include: {
                        worker: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { applications: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            status: 'success',
            data: { jobs },
        });
    } catch (error) {
        next(error);
    }
});

export { router as jobsRouter };
