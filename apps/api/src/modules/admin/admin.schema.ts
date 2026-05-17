import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  employeeCode: z.string().min(3).max(20),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
  departmentId: z.string().cuid().optional(),
  managerId: z.string().cuid().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).max(100).optional(),
  role: z.nativeEnum(Role).optional(),
  departmentId: z.string().cuid().optional(),
  managerId: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
});

export const createCycleSchema = z.object({
  name: z.string().min(3).max(100),
  year: z.number().int().min(2020).max(2100),
  goalSettingOpen: z.string().datetime(),
  goalSettingClose: z.string().datetime(),
});

export const updateCycleSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  goalSettingOpen: z.string().datetime().optional(),
  goalSettingClose: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

export const createThrustAreaSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  cycleId: z.string().cuid(),
});

export const createSharedGoalSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(1000).optional(),
  uomType: z.enum(['NUMERIC_MIN', 'NUMERIC_MAX', 'TIMELINE', 'ZERO']),
  target: z.number().positive(),
  targetDate: z.string().datetime().optional(),
  thrustAreaId: z.string().cuid(),
  cycleId: z.string().cuid(),
});

export const pushSharedGoalSchema = z.object({
  sharedGoalId: z.string().cuid(),
  userIds: z.array(z.string().cuid()).min(1),
  weightage: z.number().min(10).max(100),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type UpdateCycleInput = z.infer<typeof updateCycleSchema>;
export type CreateThrustAreaInput = z.infer<typeof createThrustAreaSchema>;
export type CreateSharedGoalInput = z.infer<typeof createSharedGoalSchema>;
export type PushSharedGoalInput = z.infer<typeof pushSharedGoalSchema>;
