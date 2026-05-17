import { Response } from 'express';
import { CyclesService } from './cycles.service';
import { AuthRequest } from '../../middleware/auth.middleware';
import logger from '../../lib/logger';

const cyclesService = new CyclesService();

export class CyclesController {
  async getActiveCycle(req: AuthRequest, res: Response) {
    try {
      const cycle = await cyclesService.getActiveCycle();

      res.json({
        success: true,
        data: { cycle },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get active cycle error');
      res.status(404).json({
        success: false,
        error: { code: 'CYCLE_ERROR', message: error.message },
      });
    }
  }

  async getAllCycles(req: AuthRequest, res: Response) {
    try {
      const cycles = await cyclesService.getAllCycles();

      res.json({
        success: true,
        data: { cycles },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get all cycles error');
      res.status(400).json({
        success: false,
        error: { code: 'CYCLE_ERROR', message: error.message },
      });
    }
  }

  async getThrustAreas(req: AuthRequest, res: Response) {
    try {
      const { cycleId } = req.params;
      const thrustAreas = await cyclesService.getThrustAreas(cycleId);

      res.json({
        success: true,
        data: { thrustAreas },
      });
    } catch (error: any) {
      logger.error({ error }, 'Get thrust areas error');
      res.status(400).json({
        success: false,
        error: { code: 'THRUST_AREA_ERROR', message: error.message },
      });
    }
  }
}
