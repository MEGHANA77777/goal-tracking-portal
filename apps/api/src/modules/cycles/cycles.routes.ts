import { Router } from 'express';
import { CyclesController } from './cycles.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const cyclesController = new CyclesController();

router.use(authMiddleware);

router.get('/active', (req, res) => cyclesController.getActiveCycle(req, res));
router.get('/', (req, res) => cyclesController.getAllCycles(req, res));
router.get('/:cycleId/thrust-areas', (req, res) => cyclesController.getThrustAreas(req, res));

export default router;
