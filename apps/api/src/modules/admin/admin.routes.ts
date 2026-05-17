import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  createCycleSchema,
  updateCycleSchema,
  createThrustAreaSchema,
  createSharedGoalSchema,
  pushSharedGoalSchema,
} from './admin.schema';
import { Role } from '@prisma/client';

const router = Router();
const adminController = new AdminController();

// All routes require admin role
router.use(authMiddleware);
router.use(requireRole(Role.ADMIN));

// ===== USERS =====
router.get('/users', (req, res) => adminController.getAllUsers(req, res));
router.post('/users', validate(createUserSchema), (req, res) => adminController.createUser(req, res));
router.patch('/users/:userId', validate(updateUserSchema), (req, res) => adminController.updateUser(req, res));
router.delete('/users/:userId', (req, res) => adminController.deleteUser(req, res));

// ===== CYCLES =====
router.get('/cycles', (req, res) => adminController.getAllCycles(req, res));
router.post('/cycles', validate(createCycleSchema), (req, res) => adminController.createCycle(req, res));
router.patch('/cycles/:cycleId', validate(updateCycleSchema), (req, res) => adminController.updateCycle(req, res));
router.post('/cycles/:cycleId/activate', (req, res) => adminController.activateCycle(req, res));

// ===== THRUST AREAS =====
router.post('/thrust-areas', validate(createThrustAreaSchema), (req, res) => 
  adminController.createThrustArea(req, res)
);
router.patch('/thrust-areas/:thrustAreaId', (req, res) => adminController.updateThrustArea(req, res));

// ===== SHARED GOALS =====
router.get('/shared-goals', (req, res) => adminController.getAllSharedGoals(req, res));
router.post('/shared-goals', validate(createSharedGoalSchema), (req, res) => 
  adminController.createSharedGoal(req, res)
);
router.post('/shared-goals/push', validate(pushSharedGoalSchema), (req, res) => 
  adminController.pushSharedGoal(req, res)
);

// ===== DASHBOARD =====
router.get('/dashboard/completion', (req, res) => adminController.getCompletionDashboard(req, res));

// ===== DEPARTMENTS =====
router.get('/departments', (req, res) => adminController.getAllDepartments(req, res));
router.post('/departments', (req, res) => adminController.createDepartment(req, res));
router.patch('/departments/:deptId', (req, res) => adminController.updateDepartment(req, res));

export default router;
