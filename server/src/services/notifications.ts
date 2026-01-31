/**
 * Notification Service
 * 
 * This service handles all notifications and is designed to be Teli-ready.
 * When Teli integration is enabled, notifications can be delivered via voice calls.
 * 
 * Current delivery methods:
 * - IN_APP: Stored in database, shown in app
 * 
 * Future delivery methods (Teli-ready):
 * - VOICE_CALL: Teli voice agent calls the user
 * - SMS: Text message (can be added later)
 */

import prisma from '../lib/prisma.js';
import { findMatchingWorkers } from './matching.js';

interface CreateNotificationParams {
    userId: string;
    type: 'NEW_JOB_MATCH' | 'APPLICATION_RECEIVED' | 'APPLICATION_ACCEPTED' |
    'APPLICATION_REJECTED' | 'NEW_MESSAGE' | 'JOB_REMINDER' |
    'REVIEW_RECEIVED' | 'JOB_COMPLETED';
    title: string;
    message: string;
    data?: any;
    deliveryMethod?: 'IN_APP' | 'SMS' | 'VOICE_CALL' | 'EMAIL';
}

interface TeliCallPayload {
    userId: string;
    phone: string;
    notificationId: string;
    type: string;
    context: any;
}

class NotificationService {
    private teliEnabled: boolean;

    constructor() {
        this.teliEnabled = process.env.TELI_ENABLED === 'true';
    }

    /**
     * Create a notification
     */
    async createNotification(params: CreateNotificationParams) {
        const {
            userId,
            type,
            title,
            message,
            data,
            deliveryMethod = 'IN_APP',
        } = params;

        // Create notification record
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                data,
                deliveryMethod,
            },
        });

        // Handle delivery based on method
        if (deliveryMethod === 'VOICE_CALL' && this.teliEnabled) {
            await this.initiateTeliCall(notification);
        }

        return notification;
    }

    /**
     * Notify matching workers when a new job is posted
     */
    async notifyMatchingWorkers(job: any) {
        const matchingWorkers = await findMatchingWorkers(job.id, prisma, 60);

        const notifications = [];

        for (const { userId, score } of matchingWorkers) {
            // Check user's notification preferences (future enhancement)
            const notification = await this.createNotification({
                userId,
                type: 'NEW_JOB_MATCH',
                title: 'New Job Match!',
                message: `A new job "${job.title}" matches your skills! Pay: $${job.payAmount}/${job.payType.toLowerCase()}`,
                data: {
                    jobId: job.id,
                    matchScore: score,
                    jobTitle: job.title,
                    payAmount: job.payAmount,
                    payType: job.payType,
                    city: job.city,
                    providesTransportation: job.providesTransportation,
                },
            });

            notifications.push(notification);
        }

        return notifications;
    }

    /**
     * Teli voice call integration (prepared but not active)
     * 
     * This method is ready to integrate with Teli AI voice agents.
     * When enabled, it will:
     * 1. Fetch user's phone number
     * 2. Prepare context for the Teli agent
     * 3. Initiate an outbound call
     * 
     * The Teli agent will be able to:
     * - Inform the user about the notification
     * - Answer questions about job details
     * - Help the user apply to jobs via voice
     * - Accept or decline job offers
     */
    private async initiateTeliCall(notification: any) {
        if (!this.teliEnabled) {
            console.log('[TELI] Voice calls disabled. Would have called for notification:', notification.id);
            return;
        }

        try {
            // Get user's phone number
            const user = await prisma.user.findUnique({
                where: { id: notification.userId },
                select: { id: true, phone: true, name: true },
            });

            if (!user?.phone) {
                console.log('[TELI] User has no phone number:', notification.userId);
                return;
            }

            // Prepare Teli payload
            const teliPayload: TeliCallPayload = {
                userId: user.id,
                phone: user.phone,
                notificationId: notification.id,
                type: notification.type,
                context: await this.buildTeliContext(notification),
            };

            // Here we would call the Teli API
            // await this.callTeliApi(teliPayload);

            console.log('[TELI] Would initiate call with payload:', teliPayload);
        } catch (error) {
            console.error('[TELI] Failed to initiate call:', error);
        }
    }

    /**
     * Build context object for Teli voice agent
     */
    private async buildTeliContext(notification: any) {
        const context: any = {
            notificationType: notification.type,
            notificationTitle: notification.title,
            notificationMessage: notification.message,
        };

        // Add type-specific context
        if (notification.type === 'NEW_JOB_MATCH' && notification.data?.jobId) {
            const job = await prisma.job.findUnique({
                where: { id: notification.data.jobId },
                include: {
                    employer: { select: { name: true } },
                    skills: true,
                },
            });

            if (job) {
                context.job = {
                    id: job.id,
                    title: job.title,
                    description: job.description,
                    pay: `$${job.payAmount} ${job.payType.toLowerCase()}`,
                    duration: job.durationHours ? `${job.durationHours} hours` :
                        job.durationDays ? `${job.durationDays} days` : 'Not specified',
                    location: job.city,
                    address: job.address,
                    startDate: job.startDate.toLocaleDateString(),
                    startTime: job.startTime,
                    workersNeeded: job.workersNeeded,
                    providesTransportation: job.providesTransportation,
                    employerName: job.employer.name,
                    skills: job.skills.map(s => s.name).join(', '),
                };
            }
        }

        if (notification.type === 'APPLICATION_ACCEPTED' && notification.data?.jobId) {
            const job = await prisma.job.findUnique({
                where: { id: notification.data.jobId },
                include: {
                    employer: { select: { name: true, phone: true } },
                },
            });

            if (job) {
                context.job = {
                    id: job.id,
                    title: job.title,
                    startDate: job.startDate.toLocaleDateString(),
                    startTime: job.startTime,
                    address: job.address,
                    city: job.city,
                    employerName: job.employer.name,
                    // Phone is shared after acceptance
                    employerPhone: job.employer.phone,
                };
            }
        }

        return context;
    }

    /**
     * Placeholder for Teli API call
     * This will be implemented when Teli integration is activated
     */
    private async callTeliApi(payload: TeliCallPayload) {
        // Implementation for Teli API call
        // Reference: https://docs.teli.ai/llms.txt

        /*
        const response = await fetch('https://api.teli.ai/v1/calls', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TELI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: payload.phone,
            agent_id: 'work-for-all-agent',
            context: payload.context,
            metadata: {
              userId: payload.userId,
              notificationId: payload.notificationId,
            },
          }),
        });
    
        const result = await response.json();
        
        // Update notification with Teli call ID
        await prisma.notification.update({
          where: { id: payload.notificationId },
          data: {
            teliCallId: result.call_id,
            teliStatus: 'initiated',
            deliveredAt: new Date(),
          },
        });
    
        return result;
        */
    }

    /**
     * Handle Teli webhook callbacks
     * This will process status updates from Teli calls
     */
    async handleTeliWebhook(payload: any) {
        if (!this.teliEnabled) return;

        const { call_id, status, user_response, metadata } = payload;

        // Update notification status
        if (metadata?.notificationId) {
            await prisma.notification.update({
                where: { id: metadata.notificationId },
                data: {
                    teliStatus: status,
                },
            });
        }

        // Handle user actions from voice call
        if (user_response?.action) {
            switch (user_response.action) {
                case 'apply_to_job':
                    // Create job application
                    await this.handleVoiceJobApplication(
                        metadata.userId,
                        user_response.jobId
                    );
                    break;
                case 'accept_job':
                    // Accept job offer
                    break;
                case 'decline_job':
                    // Decline job offer
                    break;
            }
        }
    }

    /**
     * Handle job application from voice call
     */
    private async handleVoiceJobApplication(userId: string, jobId: string) {
        // Check if already applied
        const existing = await prisma.jobApplication.findUnique({
            where: {
                jobId_workerId: { jobId, workerId: userId },
            },
        });

        if (existing) return;

        // Create application
        await prisma.jobApplication.create({
            data: {
                jobId,
                workerId: userId,
                coverNote: 'Applied via voice call',
            },
        });

        // Notify employer
        const job = await prisma.job.findUnique({
            where: { id: jobId },
        });

        if (job) {
            const worker = await prisma.user.findUnique({
                where: { id: userId },
            });

            await this.createNotification({
                userId: job.employerId,
                type: 'APPLICATION_RECEIVED',
                title: 'New Application',
                message: `${worker?.name || 'A worker'} applied for "${job.title}"`,
                data: { jobId },
            });
        }
    }
}

export const notificationService = new NotificationService();
