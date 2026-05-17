import { z } from 'zod';

export const achievementReportSchema = z.object({
  cycleId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
  format: z.enum(['json', 'csv', 'excel']).default('json'),
});

export const auditLogQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().cuid().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'UNLOCK', 'LOCK']).optional(),
  changedById: z.string().cuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type AchievementReportInput = z.infer<typeof achievementReportSchema>;
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>;
