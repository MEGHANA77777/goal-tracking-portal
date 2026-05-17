import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();
const reportsController = new ReportsController();

// All routes require authentication
router.use(authMiddleware);

// Achievement report (Manager and Admin)
router.get(
  '/achievement',
  requireRole(Role.MANAGER, Role.ADMIN),
  (req, res) => reportsController.getAchievementReport(req, res)
);

// Audit logs (Admin only)
router.get(
  '/audit-logs',
  requireRole(Role.ADMIN),
  (req, res) => reportsController.getAuditLogs(req, res)
);

// Analytics (Manager and Admin)
router.get(
  '/analytics/goal-progress',
  requireRole(Role.MANAGER, Role.ADMIN),
  (req, res) => reportsController.getGoalProgressAnalytics(req, res)
);

// User activity (Admin only)
router.get(
  '/activity/:userId',
  requireRole(Role.ADMIN),
  (req, res) => reportsController.getUserActivity(req, res)
);

export default router;
