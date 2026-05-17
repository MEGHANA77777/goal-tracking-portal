import { Router } from 'express';
import { CheckinsController } from './checkins.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  updateAchievementSchema,
  bulkUpdateAchievementsSchema,
  submitCheckinSchema,
  addCheckinCommentSchema,
  reviewCheckinSchema,
} from './checkins.schema';
import { Role } from '@prisma/client';

const router = Router();
const checkinsController = new CheckinsController();

// All routes require authentication
router.use(authMiddleware);

// Check-in windows
router.get('/windows/active', (req, res) => checkinsController.getActiveWindow(req, res));

// Employee check-ins
router.get('/my-checkins', (req, res) => checkinsController.getMyCheckins(req, res));
router.get('/goal-sheets/:goalSheetId/checkin', (req, res) => 
  checkinsController.getOrCreateCheckin(req, res)
);

// Achievements
router.patch('/achievements/:achievementId', validate(updateAchievementSchema), (req, res) => 
  checkinsController.updateAchievement(req, res)
);
router.put('/checkins/:checkinId/achievements', validate(bulkUpdateAchievementsSchema), (req, res) => 
  checkinsController.bulkUpdateAchievements(req, res)
);

// Submit check-in
router.post('/checkins/submit', validate(submitCheckinSchema), (req, res) => 
  checkinsController.submitCheckin(req, res)
);

// Comments
router.post('/checkins/comments', validate(addCheckinCommentSchema), (req, res) => 
  checkinsController.addComment(req, res)
);

// Manager routes
router.get('/team-checkins', requireRole(Role.MANAGER, Role.ADMIN), (req, res) => 
  checkinsController.getTeamCheckins(req, res)
);
router.post('/checkins/review', requireRole(Role.MANAGER, Role.ADMIN), validate(reviewCheckinSchema), (req, res) => 
  checkinsController.reviewCheckin(req, res)
);

export default router;
