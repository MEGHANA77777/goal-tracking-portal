import { Router } from 'express';
import { ManagerController } from './manager.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { 
  approveGoalSheetSchema, 
  returnGoalSheetSchema, 
  managerUpdateGoalSchema,
  unlockGoalSheetSchema 
} from './manager.schema';
import { Role } from '@prisma/client';

const router = Router();
const managerController = new ManagerController();

// All routes require authentication
router.use(authMiddleware);

// Manager routes
router.get('/team', requireRole(Role.MANAGER, Role.ADMIN), (req, res) => 
  managerController.getTeamMembers(req, res)
);

router.get('/approvals/pending', requireRole(Role.MANAGER, Role.ADMIN), (req, res) => 
  managerController.getPendingApprovals(req, res)
);

router.get('/team/goal-sheets', requireRole(Role.MANAGER, Role.ADMIN), (req, res) => 
  managerController.getTeamGoalSheets(req, res)
);

router.patch('/goals/:goalId', requireRole(Role.MANAGER, Role.ADMIN), validate(managerUpdateGoalSchema), (req, res) => 
  managerController.managerUpdateGoal(req, res)
);

router.post('/approvals/approve', requireRole(Role.MANAGER, Role.ADMIN), validate(approveGoalSheetSchema), (req, res) => 
  managerController.approveGoalSheet(req, res)
);

router.post('/approvals/return', requireRole(Role.MANAGER, Role.ADMIN), validate(returnGoalSheetSchema), (req, res) => 
  managerController.returnGoalSheet(req, res)
);

// Admin only: Unlock goal sheet
router.post('/goal-sheets/unlock', requireRole(Role.ADMIN), validate(unlockGoalSheetSchema), (req, res) => 
  managerController.unlockGoalSheet(req, res)
);

export default router;
