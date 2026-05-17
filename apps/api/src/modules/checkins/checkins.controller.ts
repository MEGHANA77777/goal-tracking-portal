import { Response } from 'express';
import { CheckinsService } from './checkins.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import logger from '../../lib/logger';

const checkinsService = new CheckinsService();

export class CheckinsController {
  async getActiveWindow(req: AuthRequest, res: Response) {
    try {
      const window = await checkinsService.getActiveCheckinWindow();

      if (!window) {
        return res.status(404).json({
          success: false,
          error: { code: 'NO_ACTIVE_WINDOW', message: 'No active check-in window' },
        });
      }

      res.json({
        success: true,
        data: { window },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get active window error');
      res.status(400).json({
        success: false,
        error: { code: 'WINDOW_ERROR', message: error.message },
      });
    }
  }

  async getOrCreateCheckin(req: AuthRequest, res: Response) {
    try {
      const { goalSheetId } = req.params;
      const userId = req.user!.userId;

      const checkin = await checkinsService.getOrCreateCheckin(goalSheetId, userId);

      res.json({
        success: true,
        data: { checkin },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get/create check-in error');
      res.status(400).json({
        success: false,
        error: { code: 'CHECKIN_ERROR', message: error.message },
      });
    }
  }

  async updateAchievement(req: AuthRequest, res: Response) {
    try {
      const { achievementId } = req.params;
      const userId = req.user!.userId;

      const achievement = await checkinsService.updateAchievement(achievementId, userId, req.body);

      res.json({
        success: true,
        data: { achievement },
      });
    } catch (error: any) {
      logger.error({ error }, 'Update achievement error');
      res.status(400).json({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message },
      });
    }
  }

  async bulkUpdateAchievements(req: AuthRequest, res: Response) {
    try {
      const { checkinId } = req.params;
      const userId = req.user!.userId;

      const achievements = await checkinsService.bulkUpdateAchievements(checkinId, userId, req.body);

      res.json({
        success: true,
        data: { achievements },
      });
    } catch (error: any) {
      logger.error({ error }, 'Bulk update achievements error');
      res.status(400).json({
        success: false,
        error: { code: 'BULK_UPDATE_ERROR', message: error.message },
      });
    }
  }

  async submitCheckin(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const checkin = await checkinsService.submitCheckin(req.body, userId);

      res.json({
        success: true,
        data: { checkin },
      });
    } catch (error: any) {
      logger.error({ error }, 'Submit check-in error');
      res.status(400).json({
        success: false,
        error: { code: 'SUBMIT_ERROR', message: error.message },
      });
    }
  }

  async addComment(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const comment = await checkinsService.addComment(req.body, userId, role);

      res.json({
        success: true,
        data: { comment },
      });
    } catch (error: any) {
      logger.error({ error }, 'Add comment error');
      res.status(400).json({
        success: false,
        error: { code: 'COMMENT_ERROR', message: error.message },
      });
    }
  }

  async reviewCheckin(req: AuthRequest, res: Response) {
    try {
      const managerId = req.user!.userId;
      const checkin = await checkinsService.reviewCheckin(req.body, managerId);

      res.json({
        success: true,
        data: { checkin },
      });
    } catch (error: any) {
      logger.error({ error }, 'Review check-in error');
      res.status(400).json({
        success: false,
        error: { code: 'REVIEW_ERROR', message: error.message },
      });
    }
  }

  async getTeamCheckins(req: AuthRequest, res: Response) {
    try {
      const managerId = req.user!.userId;
      const { windowId } = req.query;

      const checkins = await checkinsService.getTeamCheckins(managerId, windowId as string);

      res.json({
        success: true,
        data: { checkins },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get team check-ins error');
      res.status(400).json({
        success: false,
        error: { code: 'TEAM_CHECKINS_ERROR', message: error.message },
      });
    }
  }

  async getMyCheckins(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const checkins = await checkinsService.getMyCheckins(userId);

      res.json({
        success: true,
        data: { checkins },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get my check-ins error');
      res.status(400).json({
        success: false,
        error: { code: 'MY_CHECKINS_ERROR', message: error.message },
      });
    }
  }
}
