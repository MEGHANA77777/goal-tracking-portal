import { Router } from 'express';
import { GoalsController } from './goals.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createGoalSheetSchema, createGoalSchema, updateGoalSchema, validateWeightageSchema } from './goals.schema';

const router = Router();
const goalsController = new GoalsController();

// All routes require authentication
router.use(authMiddleware);

// Goal sheets
router.post('/goal-sheets', validate(createGoalSheetSchema), (req, res) => 
  goalsController.getOrCreateGoalSheet(req, res)
);
router.get('/goal-sheets', (req, res) => goalsController.getMyGoalSheets(req, res));
router.get('/goal-sheets/:id', (req, res) => goalsController.getGoalSheetById(req, res));
router.patch('/goal-sheets/:goalSheetId/submit', (req, res) => 
  goalsController.submitGoalSheet(req, res)
);

// Goals
router.post('/goal-sheets/:goalSheetId/goals', validate(createGoalSchema), (req, res) => 
  goalsController.addGoal(req, res)
);
router.patch('/goals/:goalId', validate(updateGoalSchema), (req, res) => 
  goalsController.updateGoal(req, res)
);
router.delete('/goals/:goalId', (req, res) => goalsController.deleteGoal(req, res));

// Validation
router.post('/goals/validate-weightage', validate(validateWeightageSchema), (req, res) => 
  goalsController.validateWeightage(req, res)
);

export default router;
