import { z } from 'zod';
import { UoMType, GoalStatus } from '@prisma/client';

export const createGoalSheetSchema = z.object({
  cycleId: z.string().cuid(),
});

export const createGoalSchema = z.object({
  thrustAreaId: z.string().cuid(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(1000).optional(),
  uomType: z.nativeEnum(UoMType),
  target: z.number().positive('Target must be positive'),
  targetDate: z.string().datetime().optional(),
  weightage: z.number().min(10, 'Minimum weightage is 10%').max(100, 'Maximum weightage is 100%'),
});

export const updateGoalSchema = z.object({
  thrustAreaId: z.string().cuid().optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional(),
  uomType: z.nativeEnum(UoMType).optional(),
  target: z.number().positive().optional(),
  targetDate: z.string().datetime().optional(),
  weightage: z.number().min(10).max(100).optional(),
});

export const validateWeightageSchema = z.object({
  goals: z.array(z.object({
    id: z.string().optional(),
    weightage: z.number(),
  })).min(1).max(8, 'Maximum 8 goals allowed'),
});

export type CreateGoalSheetInput = z.infer<typeof createGoalSheetSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type ValidateWeightageInput = z.infer<typeof validateWeightageSchema>;
