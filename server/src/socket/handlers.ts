import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

export function setupSocketHandlers(io: Server) {
    // Authentication middleware
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
                userId: string;
            };
            socket.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
        console.log(`User connected: ${socket.userId}`);

        // Join user's personal room for notifications
        if (socket.userId) {
            socket.join(`user:${socket.userId}`);
        }

        // Join conversation room
        socket.on('join_conversation', (conversationId: string) => {
            socket.join(`conversation:${conversationId}`);
            console.log(`User ${socket.userId} joined conversation ${conversationId}`);
        });

        // Leave conversation room
        socket.on('leave_conversation', (conversationId: string) => {
            socket.leave(`conversation:${conversationId}`);
        });

        // Typing indicator
        socket.on('typing_start', (conversationId: string) => {
            socket.to(`conversation:${conversationId}`).emit('user_typing', {
                conversationId,
                userId: socket.userId,
            });
        });

        socket.on('typing_stop', (conversationId: string) => {
            socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
                conversationId,
                userId: socket.userId,
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.userId}`);
        });
    });
}
