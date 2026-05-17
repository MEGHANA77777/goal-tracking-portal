import { Response } from 'express';
import { ManagerService } from './manager.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import logger from '../../lib/logger';

const managerService = new ManagerService();

export class ManagerController {
  async getTeamMembers(req: AuthRequest, res: Response) {
    try {
      const managerId = req.user!.userId;
      const team = await managerService.getTeamMembers(managerId);

      res.json({
        success: true,
        data: { team },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get team members error');
      res.status(400).json({
        success: false,
        error: { code: 'TEAM_ERROR', message: error.message },
      });
    }
  }

  async getPendingApprovals(req: AuthRequest, res: Response) {
    try {
      const managerId = req.user!.userId;
      const goalSheets = await managerService.getPendingApprovals(managerId);

      res.json({
        success: true,
        data: { goalSheets, count: goalSheets.length },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get pending approvals error');
      res.status(400).json({
        success: false,
        error: { code: 'APPROVAL_ERROR', message: error.message },
      });
    }
  }

  async getTeamGoalSheets(req: AuthRequest, res: Response) {
    try {
      const managerId = req.user!.userId;
      const goalSheets = await managerService.getTeamGoalSheets(managerId);

      res.json({
        success: true,
        data: { goalSheets },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get team goal sheets error');
      res.status(400).json({
        success: false,
        error: { code: 'TEAM_GOALS_ERROR', message: error.message },
      });
    }
  }

  async managerUpdateGoal(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params;
      const managerId = req.user!.userId;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const goal = await managerService.managerUpdateGoal(goalId, managerId, req.body, ipAddress, userAgent);

      res.json({
        success: true,
        data: { goal },
      });
    } catch (error: any) {
      logger.error({ error }, 'Manager update goal error');
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  }

  async approveGoalSheet(req: AuthRequest, res: Response) {
    try {
      const managerId = req.user!.userId;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const goalSheet = await managerService.approveGoalSheet(req.body, managerId, ipAddress, userAgent);

      res.json({
        success: true,
        data: { goalSheet },
      });
    } catch (error: any) {
      logger.error({ error }, 'Approve goal sheet error');
      res.status(400).json({
        success: false,
        error: { code: 'APPROVE_ERROR', message: error.message },
      });
    }
  }

  async returnGoalSheet(req: AuthRequest, res: Response) {
    try {
      const managerId = req.user!.userId;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const goalSheet = await managerService.returnGoalSheet(req.body, managerId, ipAddress, userAgent);

      res.json({
        success: true,
        data: { goalSheet },
      });
    } catch (error: any) {
      logger.error({ error }, 'Return goal sheet error');
      res.status(400).json({
        success: false,
        error: { code: 'RETURN_ERROR', message: error.message },
      });
    }
  }

  async unlockGoalSheet(req: AuthRequest, res: Response) {
    try {
      const adminId = req.user!.userId;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const goalSheet = await managerService.unlockGoalSheet(req.body, adminId, ipAddress, userAgent);

      res.json({
        success: true,
        data: { goalSheet },
      });
    } catch (error: any) {
      logger.error({ error }, 'Unlock goal sheet error');
      res.status(400).json({
        success: false,
        error: { code: 'UNLOCK_ERROR', message: error.message },
      });
    }
  }
}
