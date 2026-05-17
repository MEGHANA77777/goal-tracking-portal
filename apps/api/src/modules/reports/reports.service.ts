import prisma from '../../lib/prisma';
import { calculateWeightedScore } from '../../lib/score-calculator';
import { AchievementReportInput, AuditLogQueryInput } from './reports.schema';

export class ReportsService {
  // ===== ACHIEVEMENT REPORT =====

  async getAchievementReport(filters: AchievementReportInput) {
    const where: any = {};
    
    if (filters.cycleId) {
      where.cycleId = filters.cycleId;
    }
    
    if (filters.departmentId) {
      where.user = { departmentId: filters.departmentId };
    }

    const goalSheets = await prisma.goalSheet.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCode: true,
            department: { select: { name: true } },
            manager: { select: { name: true } },
          },
        },
        cycle: { select: { name: true, year: true } },
        goals: {
          include: {
            thrustArea: { select: { name: true } },
            achievements: {
              include: {
                checkin: {
                  include: {
                    window: { select: { quarter: true, label: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ user: { name: 'asc' } }],
    });

    const report = goalSheets.map((sheet) => {
      const goalsWithLatestAchievement = sheet.goals.map((goal) => {
        // Get latest achievement (Q4 > Q3 > Q2 > Q1)
        const latestAchievement = goal.achievements.sort(
          (a, b) => b.checkin.window.quarter - a.checkin.window.quarter
        )[0];

        return {
          goalId: goal.id,
          thrustArea: goal.thrustArea.name,
          title: goal.title,
          uomType: goal.uomType,
          target: goal.target,
          targetDate: goal.targetDate,
          weightage: goal.weightage,
          actualValue: latestAchievement?.actualValue || null,
          actualDate: latestAchievement?.actualDate || null,
          status: latestAchievement?.status || 'NOT_STARTED',
          progressScore: latestAchievement?.progressScore || 0,
          quarter: latestAchievement?.checkin.window.label || 'N/A',
        };
      });

      const weightedScore = calculateWeightedScore(
        goalsWithLatestAchievement.map((g) => ({
          weightage: g.weightage,
          progressScore: g.progressScore,
        }))
      );

      return {
        employeeCode: sheet.user.employeeCode,
        employeeName: sheet.user.name,
        email: sheet.user.email,
        department: sheet.user.department?.name || 'N/A',
        manager: sheet.user.manager?.name || 'N/A',
        cycle: sheet.cycle.name,
        goalSheetStatus: sheet.status,
        totalWeightage: sheet.totalWeightage,
        weightedScore,
        goals: goalsWithLatestAchievement,
      };
    });

    return report;
  }

  // ===== AUDIT LOGS =====

  async getAuditLogs(query: AuditLogQueryInput) {
    const where: any = {};

    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.action) where.action = query.action;
    if (query.changedById) where.changedById = query.changedById;

    if (query.startDate || query.endDate) {
      where.changedAt = {};
      if (query.startDate) where.changedAt.gte = new Date(query.startDate);
      if (query.endDate) where.changedAt.lte = new Date(query.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          changedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { changedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  // ===== ANALYTICS =====

  async getGoalProgressAnalytics(cycleId?: string) {
    const where: any = {};
    if (cycleId) where.cycleId = cycleId;

    // Goals by status
    const goalsByStatus = await prisma.achievement.groupBy({
      by: ['status'],
      where: {
        checkin: {
          goalSheet: where,
        },
      },
      _count: true,
    });

    // Goals by UoM type
    const goalsByUoM = await prisma.goal.groupBy({
      by: ['uomType'],
      where: {
        goalSheet: where,
      },
      _count: true,
    });

    // Average progress score by thrust area
    const thrustAreas = await prisma.thrustArea.findMany({
      where: cycleId ? { cycleId } : {},
      include: {
        goals: {
          include: {
            achievements: {
              orderBy: { checkin: { window: { quarter: 'desc' } } },
              take: 1,
            },
          },
        },
      },
    });

    const thrustAreaProgress = thrustAreas.map((ta) => {
      const scores = ta.goals
        .map((g) => g.achievements[0]?.progressScore)
        .filter((s) => s !== null && s !== undefined) as number[];

      const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      return {
        thrustAreaId: ta.id,
        thrustAreaName: ta.name,
        totalGoals: ta.goals.length,
        averageProgressScore: Math.round(avgScore * 100) / 100,
      };
    });

    return {
      goalsByStatus: goalsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      goalsByUoM: goalsByUoM.reduce((acc, item) => {
        acc[item.uomType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      thrustAreaProgress,
    };
  }

  // ===== USER ACTIVITY =====

  async getUserActivity(userId: string, limit: number = 20) {
    const activities = await prisma.auditLog.findMany({
      where: { changedById: userId },
      include: {
        changedBy: {
          select: { name: true, role: true },
        },
      },
      orderBy: { changedAt: 'desc' },
      take: limit,
    });

    return activities;
  }
}
