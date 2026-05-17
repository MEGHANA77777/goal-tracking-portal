import { z } from 'zod';

export const approveGoalSheetSchema = z.object({
  goalSheetId: z.string().cuid(),
});

export const returnGoalSheetSchema = z.object({
  goalSheetId: z.string().cuid(),
  reason: z.string().min(10, 'Return reason must be at least 10 characters').max(500),
});

export const managerUpdateGoalSchema = z.object({
  target: z.number().positive().optional(),
  targetDate: z.string().datetime().optional(),
  weightage: z.number().min(10).max(100).optional(),
});

export const unlockGoalSheetSchema = z.object({
  goalSheetId: z.string().cuid(),
  reason: z.string().min(10, 'Unlock reason must be at least 10 characters').max(500),
});

export type ApproveGoalSheetInput = z.infer<typeof approveGoalSheetSchema>;
export type ReturnGoalSheetInput = z.infer<typeof returnGoalSheetSchema>;
export type ManagerUpdateGoalInput = z.infer<typeof managerUpdateGoalSchema>;
export type UnlockGoalSheetInput = z.infer<typeof unlockGoalSheetSchema>;
