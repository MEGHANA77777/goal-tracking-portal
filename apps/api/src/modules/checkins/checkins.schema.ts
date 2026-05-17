import { z } from 'zod';
import { GoalStatus } from '@prisma/client';

export const updateAchievementSchema = z.object({
  actualValue: z.number().optional(),
  actualDate: z.string().datetime().optional(),
  status: z.nativeEnum(GoalStatus),
  notes: z.string().max(1000).optional(),
});

export const bulkUpdateAchievementsSchema = z.object({
  achievements: z.array(
    z.object({
      goalId: z.string().cuid(),
      actualValue: z.number().optional(),
      actualDate: z.string().datetime().optional(),
      status: z.nativeEnum(GoalStatus),
      notes: z.string().max(1000).optional(),
    })
  ),
});

export const submitCheckinSchema = z.object({
  checkinId: z.string().cuid(),
});

export const addCheckinCommentSchema = z.object({
  checkinId: z.string().cuid(),
  content: z.string().min(10, 'Comment must be at least 10 characters').max(1000),
  isManagerComment: z.boolean().default(false),
});

export const reviewCheckinSchema = z.object({
  checkinId: z.string().cuid(),
});

export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;
export type BulkUpdateAchievementsInput = z.infer<typeof bulkUpdateAchievementsSchema>;
export type SubmitCheckinInput = z.infer<typeof submitCheckinSchema>;
export type AddCheckinCommentInput = z.infer<typeof addCheckinCommentSchema>;
export type ReviewCheckinInput = z.infer<typeof reviewCheckinSchema>;
