import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { jobsRouter } from './routes/jobs.js';
import { applicationsRouter } from './routes/applications.js';
import { reviewsRouter } from './routes/reviews.js';
import { messagesRouter } from './routes/messages.js';
import { skillsRouter } from './routes/skills.js';
import { notificationsRouter } from './routes/notifications.js';
import { setupSocketHandlers } from './socket/handlers.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// Make io available to routes
app.set('io', io);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/notifications', notificationsRouter);

// Error handling
app.use(errorHandler);

// Socket.io setup
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server ready`);
});

export { app, io };
