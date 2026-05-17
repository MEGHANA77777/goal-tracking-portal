import { Response } from 'express';
import { GoalsService } from './goals.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import logger from '../../lib/logger';

const goalsService = new GoalsService();

export class GoalsController {
  // Get or create goal sheet for active cycle
  async getOrCreateGoalSheet(req: AuthRequest, res: Response) {
    try {
      const { cycleId } = req.body;
      const userId = req.user!.userId;

      const goalSheet = await goalsService.getOrCreateGoalSheet(userId, cycleId);

      res.json({
        success: true,
        data: { goalSheet },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get/create goal sheet error');
      res.status(400).json({
        success: false,
        error: { code: 'GOAL_SHEET_ERROR', message: error.message },
      });
    }
  }

  // Get goal sheet by ID
  async getGoalSheetById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const goalSheet = await goalsService.getGoalSheetById(id, userId, role);

      res.json({
        success: true,
        data: { goalSheet },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get goal sheet error');
      res.status(error.message === 'Access denied' ? 403 : 404).json({
        success: false,
        error: { code: 'GOAL_SHEET_ERROR', message: error.message },
      });
    }
  }

  // Get my goal sheets
  async getMyGoalSheets(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const goalSheets = await goalsService.getMyGoalSheets(userId);

      res.json({
        success: true,
        data: { goalSheets },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get my goal sheets error');
      res.status(400).json({
        success: false,
        error: { code: 'GOAL_SHEET_ERROR', message: error.message },
      });
    }
  }

  // Add goal to sheet
  async addGoal(req: AuthRequest, res: Response) {
    try {
      const { goalSheetId } = req.params;
      const userId = req.user!.userId;

      const goal = await goalsService.addGoal(goalSheetId, userId, req.body);

      res.status(201).json({
        success: true,
        data: { goal },
      });
    } catch (error: any) {
      logger.error({ error }, 'Add goal error');
      res.status(400).json({
        success: false,
        error: { code: 'ADD_GOAL_ERROR', message: error.message },
      });
    }
  }

  // Update goal
  async updateGoal(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params;
      const userId = req.user!.userId;

      const goal = await goalsService.updateGoal(goalId, userId, req.body);

      res.json({
        success: true,
        data: { goal },
      });
    } catch (error: any) {
      logger.error({ error }, 'Update goal error');
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_GOAL_ERROR', message: error.message },
      });
    }
  }

  // Delete goal
  async deleteGoal(req: AuthRequest, res: Response) {
    try {
      const { goalId } = req.params;
      const userId = req.user!.userId;

      const result = await goalsService.deleteGoal(goalId, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error({ error }, 'Delete goal error');
      res.status(400).json({
        success: false,
        error: { code: 'DELETE_GOAL_ERROR', message: error.message },
      });
    }
  }

  // Submit goal sheet
  async submitGoalSheet(req: AuthRequest, res: Response) {
    try {
      const { goalSheetId } = req.params;
      const userId = req.user!.userId;

      const goalSheet = await goalsService.submitGoalSheet(goalSheetId, userId);

      res.json({
        success: true,
        data: { goalSheet },
      });
    } catch (error: any) {
      logger.error({ error }, 'Submit goal sheet error');
      res.status(400).json({
        success: false,
        error: { code: 'SUBMIT_ERROR', message: error.message },
      });
    }
  }

  // Validate weightage
  async validateWeightage(req: AuthRequest, res: Response) {
    try {
      const { goals } = req.body;
      const validation = goalsService.validateWeightage(goals);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error: any) {
      logger.error({ error }, 'Validate weightage error');
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.message },
      });
    }
  }
}
