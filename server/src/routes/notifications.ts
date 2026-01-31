import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get user notifications
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { page = '1', limit = '20', unreadOnly = 'false' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const where: any = { userId: req.user!.id };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        });

        const total = await prisma.notification.count({ where });
        const unreadCount = await prisma.notification.count({
            where: { userId: req.user!.id, isRead: false },
        });

        res.json({
            status: 'success',
            data: {
                notifications,
                unreadCount,
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

// Mark notification as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { id } = req.params;

        const notification = await prisma.notification.updateMany({
            where: {
                id,
                userId: req.user!.id,
            },
            data: { isRead: true },
        });

        res.json({
            status: 'success',
            message: 'Notification marked as read',
        });
    } catch (error) {
        next(error);
    }
});

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req: AuthRequest, res, next) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.user!.id,
                isRead: false,
            },
            data: { isRead: true },
        });

        res.json({
            status: 'success',
            message: 'All notifications marked as read',
        });
    } catch (error) {
        next(error);
    }
});

export { router as notificationsRouter };
