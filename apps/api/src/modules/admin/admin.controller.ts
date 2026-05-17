import { Response } from 'express';
import { AdminService } from './admin.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import logger from '../../lib/logger';

const adminService = new AdminService();

export class AdminController {
  // ===== USERS =====

  async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const users = await adminService.getAllUsers();
      res.json({ success: true, data: { users } });
    } catch (error: any) {
      logger.error({ error }, 'Get all users error');
      res.status(400).json({ success: false, error: { code: 'USER_ERROR', message: error.message } });
    }
  }

  async createUser(req: AuthRequest, res: Response) {
    try {
      const user = await adminService.createUser(req.body);
      res.status(201).json({ success: true, data: { user } });
    } catch (error: any) {
      logger.error({ error }, 'Create user error');
      res.status(400).json({ success: false, error: { code: 'CREATE_USER_ERROR', message: error.message } });
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const user = await adminService.updateUser(userId, req.body);
      res.json({ success: true, data: { user } });
    } catch (error: any) {
      logger.error({ error }, 'Update user error');
      res.status(400).json({ success: false, error: { code: 'UPDATE_USER_ERROR', message: error.message } });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const result = await adminService.deleteUser(userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error({ error }, 'Delete user error');
      res.status(400).json({ success: false, error: { code: 'DELETE_USER_ERROR', message: error.message } });
    }
  }

  // ===== CYCLES =====

  async getAllCycles(req: AuthRequest, res: Response) {
    try {
      const cycles = await adminService.getAllCycles();
      res.json({ success: true, data: { cycles } });
    } catch (error: any) {
      logger.error({ error }, 'Get all cycles error');
      res.status(400).json({ success: false, error: { code: 'CYCLE_ERROR', message: error.message } });
    }
  }

  async createCycle(req: AuthRequest, res: Response) {
    try {
      const cycle = await adminService.createCycle(req.body);
      res.status(201).json({ success: true, data: { cycle } });
    } catch (error: any) {
      logger.error({ error }, 'Create cycle error');
      res.status(400).json({ success: false, error: { code: 'CREATE_CYCLE_ERROR', message: error.message } });
    }
  }

  async updateCycle(req: AuthRequest, res: Response) {
    try {
      const { cycleId } = req.params;
      const cycle = await adminService.updateCycle(cycleId, req.body);
      res.json({ success: true, data: { cycle } });
    } catch (error: any) {
      logger.error({ error }, 'Update cycle error');
      res.status(400).json({ success: false, error: { code: 'UPDATE_CYCLE_ERROR', message: error.message } });
    }
  }

  async activateCycle(req: AuthRequest, res: Response) {
    try {
      const { cycleId } = req.params;
      const cycle = await adminService.activateCycle(cycleId);
      res.json({ success: true, data: { cycle } });
    } catch (error: any) {
      logger.error({ error }, 'Activate cycle error');
      res.status(400).json({ success: false, error: { code: 'ACTIVATE_CYCLE_ERROR', message: error.message } });
    }
  }

  // ===== THRUST AREAS =====

  async createThrustArea(req: AuthRequest, res: Response) {
    try {
      const thrustArea = await adminService.createThrustArea(req.body);
      res.status(201).json({ success: true, data: { thrustArea } });
    } catch (error: any) {
      logger.error({ error }, 'Create thrust area error');
      res.status(400).json({ success: false, error: { code: 'CREATE_THRUST_AREA_ERROR', message: error.message } });
    }
  }

  async updateThrustArea(req: AuthRequest, res: Response) {
    try {
      const { thrustAreaId } = req.params;
      const thrustArea = await adminService.updateThrustArea(thrustAreaId, req.body);
      res.json({ success: true, data: { thrustArea } });
    } catch (error: any) {
      logger.error({ error }, 'Update thrust area error');
      res.status(400).json({ success: false, error: { code: 'UPDATE_THRUST_AREA_ERROR', message: error.message } });
    }
  }

  // ===== SHARED GOALS =====

  async getAllSharedGoals(req: AuthRequest, res: Response) {
    try {
      const { cycleId } = req.query;
      const sharedGoals = await adminService.getAllSharedGoals(cycleId as string);
      res.json({ success: true, data: { sharedGoals } });
    } catch (error: any) {
      logger.error({ error }, 'Get shared goals error');
      res.status(400).json({ success: false, error: { code: 'SHARED_GOAL_ERROR', message: error.message } });
    }
  }

  async createSharedGoal(req: AuthRequest, res: Response) {
    try {
      const createdById = req.user!.userId;
      const sharedGoal = await adminService.createSharedGoal(req.body, createdById);
      res.status(201).json({ success: true, data: { sharedGoal } });
    } catch (error: any) {
      logger.error({ error }, 'Create shared goal error');
      res.status(400).json({ success: false, error: { code: 'CREATE_SHARED_GOAL_ERROR', message: error.message } });
    }
  }

  async pushSharedGoal(req: AuthRequest, res: Response) {
    try {
      const results = await adminService.pushSharedGoal(req.body);
      res.json({ success: true, data: { results } });
    } catch (error: any) {
      logger.error({ error }, 'Push shared goal error');
      res.status(400).json({ success: false, error: { code: 'PUSH_SHARED_GOAL_ERROR', message: error.message } });
    }
  }

  // ===== DASHBOARD =====

  async getCompletionDashboard(req: AuthRequest, res: Response) {
    try {
      const { cycleId } = req.query;
      const dashboard = await adminService.getCompletionDashboard(cycleId as string);
      res.json({ success: true, data: dashboard });
    } catch (error: any) {
      logger.error({ error }, 'Get completion dashboard error');
      res.status(400).json({ success: false, error: { code: 'DASHBOARD_ERROR', message: error.message } });
    }
  }

  // ===== DEPARTMENTS =====

  async getAllDepartments(req: AuthRequest, res: Response) {
    try {
      const departments = await adminService.getAllDepartments();
      res.json({ success: true, data: { departments } });
    } catch (error: any) {
      logger.error({ error }, 'Get departments error');
      res.status(400).json({ success: false, error: { code: 'DEPARTMENT_ERROR', message: error.message } });
    }
  }

  async createDepartment(req: AuthRequest, res: Response) {
    try {
      const department = await adminService.createDepartment(req.body);
      res.status(201).json({ success: true, data: { department } });
    } catch (error: any) {
      logger.error({ error }, 'Create department error');
      res.status(400).json({ success: false, error: { code: 'CREATE_DEPARTMENT_ERROR', message: error.message } });
    }
  }

  async updateDepartment(req: AuthRequest, res: Response) {
    try {
      const { deptId } = req.params;
      const department = await adminService.updateDepartment(deptId, req.body);
      res.json({ success: true, data: { department } });
    } catch (error: any) {
      logger.error({ error }, 'Update department error');
      res.status(400).json({ success: false, error: { code: 'UPDATE_DEPARTMENT_ERROR', message: error.message } });
    }
  }
}
