import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import logger from './lib/logger';
import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import goalsRoutes from './modules/goals/goals.routes';
import cyclesRoutes from './modules/cycles/cycles.routes';
import managerRoutes from './modules/manager/manager.routes';
import checkinsRoutes from './modules/checkins/checkins.routes';
import adminRoutes from './modules/admin/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cycles', cyclesRoutes);
app.use('/api/v1/manager', managerRoutes);
app.use('/api/v1/checkins', checkinsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1', goalsRoutes);

// Error handling
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' },
  });
});

app.listen(PORT, () => {
  logger.info(`🚀 API server running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
