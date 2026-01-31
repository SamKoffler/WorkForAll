import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { AppError } from './errorHandler.js';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string | null;
        userType: string;
    };
    sessionToken?: string;
}

// Verify JWT token
export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
            sessionToken?: string;
        };

        // Check if it's a session token (guest user)
        if (decoded.sessionToken) {
            const user = await prisma.user.findUnique({
                where: { sessionToken: decoded.sessionToken },
                select: { id: true, email: true, userType: true },
            });

            if (!user) {
                throw new AppError('Invalid session', 401);
            }

            req.user = user;
            req.sessionToken = decoded.sessionToken;
        } else {
            // Regular user
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, email: true, userType: true },
            });

            if (!user) {
                throw new AppError('User not found', 401);
            }

            req.user = user;
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
                userId: string;
                sessionToken?: string;
            };

            if (decoded.sessionToken) {
                const user = await prisma.user.findUnique({
                    where: { sessionToken: decoded.sessionToken },
                    select: { id: true, email: true, userType: true },
                });
                if (user) {
                    req.user = user;
                    req.sessionToken = decoded.sessionToken;
                }
            } else {
                const user = await prisma.user.findUnique({
                    where: { id: decoded.userId },
                    select: { id: true, email: true, userType: true },
                });
                if (user) {
                    req.user = user;
                }
            }
        } catch {
            // Token invalid, continue without auth
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Require specific user types
export const requireUserType = (...types: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError('Authentication required', 401));
        }

        if (!types.includes(req.user.userType) && !types.includes('BOTH')) {
            return next(new AppError('Insufficient permissions', 403));
        }

        next();
    };
};
