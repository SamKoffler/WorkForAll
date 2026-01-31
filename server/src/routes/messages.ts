import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get conversations for current user
router.get('/conversations', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: req.user!.id },
                },
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatarUrl: true },
                        },
                    },
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        // Format conversations
        const formattedConversations = conversations.map(conv => {
            const otherParticipant = conv.participants.find(p => p.userId !== req.user!.id);
            const lastMessage = conv.messages[0];

            return {
                id: conv.id,
                jobId: conv.jobId,
                otherUser: otherParticipant?.user,
                lastMessage: lastMessage ? {
                    content: lastMessage.content,
                    createdAt: lastMessage.createdAt,
                    isFromMe: lastMessage.senderId === req.user!.id,
                } : null,
                updatedAt: conv.updatedAt,
            };
        });

        res.json({
            status: 'success',
            data: { conversations: formattedConversations },
        });
    } catch (error) {
        next(error);
    }
});

// Get messages in a conversation
router.get('/conversations/:conversationId', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { conversationId } = req.params;
        const { page = '1', limit = '50' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Check if user is part of conversation
        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: req.user!.id,
                },
            },
        });

        if (!participant) {
            throw new AppError('Not authorized to view this conversation', 403);
        }

        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true },
                },
            },
        });

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                conversationId,
                receiverId: req.user!.id,
                isRead: false,
            },
            data: { isRead: true },
        });

        // Update last read
        await prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: req.user!.id,
                },
            },
            data: { lastReadAt: new Date() },
        });

        const total = await prisma.message.count({ where: { conversationId } });

        res.json({
            status: 'success',
            data: {
                conversation: {
                    id: conversation!.id,
                    jobId: conversation!.jobId,
                    participants: conversation!.participants.map(p => p.user),
                },
                messages: messages.reverse(), // Return in chronological order
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

// Send a message
router.post(
    '/send',
    authenticate,
    [
        body('conversationId').notEmpty().withMessage('Conversation ID is required'),
        body('content').trim().notEmpty().withMessage('Message content is required'),
    ],
    async (req: AuthRequest, res, next) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw new AppError(errors.array()[0].msg, 400);
            }

            const { conversationId, content } = req.body;

            // Check if user is part of conversation
            const conversation = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: {
                    participants: true,
                },
            });

            if (!conversation) {
                throw new AppError('Conversation not found', 404);
            }

            const isParticipant = conversation.participants.some(p => p.userId === req.user!.id);
            if (!isParticipant) {
                throw new AppError('Not authorized to send messages in this conversation', 403);
            }

            // Find receiver
            const receiver = conversation.participants.find(p => p.userId !== req.user!.id);
            if (!receiver) {
                throw new AppError('Receiver not found', 400);
            }

            const message = await prisma.message.create({
                data: {
                    conversationId,
                    senderId: req.user!.id,
                    receiverId: receiver.userId,
                    content,
                },
                include: {
                    sender: {
                        select: { id: true, name: true, avatarUrl: true },
                    },
                },
            });

            // Update conversation
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { updatedAt: new Date() },
            });

            // Emit socket event for real-time
            const io = req.app.get('io');
            io.to(`user:${receiver.userId}`).emit('new_message', {
                conversationId,
                message,
            });

            res.status(201).json({
                status: 'success',
                data: { message },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Get unread message count
router.get('/unread-count', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const count = await prisma.message.count({
            where: {
                receiverId: req.user!.id,
                isRead: false,
            },
        });

        res.json({
            status: 'success',
            data: { unreadCount: count },
        });
    } catch (error) {
        next(error);
    }
});

// Start a conversation (for accepted job applications)
router.post('/start-conversation', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { jobId, otherUserId } = req.body;

        // Check if there's an accepted application
        const application = await prisma.jobApplication.findFirst({
            where: {
                jobId,
                status: 'ACCEPTED',
                OR: [
                    { workerId: req.user!.id },
                    { workerId: otherUserId },
                ],
            },
            include: { job: true },
        });

        if (!application) {
            throw new AppError('No accepted application found for this job', 400);
        }

        // Check authorization
        const isWorker = application.workerId === req.user!.id || application.workerId === otherUserId;
        const isEmployer = application.job.employerId === req.user!.id || application.job.employerId === otherUserId;

        if (!isWorker && !isEmployer) {
            throw new AppError('Not authorized to start this conversation', 403);
        }

        // Check if conversation already exists
        let conversation = await prisma.conversation.findFirst({
            where: {
                jobId,
                AND: [
                    { participants: { some: { userId: req.user!.id } } },
                    { participants: { some: { userId: otherUserId } } },
                ],
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    jobId,
                    participants: {
                        create: [
                            { userId: req.user!.id },
                            { userId: otherUserId },
                        ],
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: { id: true, name: true, avatarUrl: true },
                            },
                        },
                    },
                },
            });
        }

        res.json({
            status: 'success',
            data: { conversation },
        });
    } catch (error) {
        next(error);
    }
});

export { router as messagesRouter };
