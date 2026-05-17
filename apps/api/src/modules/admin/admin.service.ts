import prisma from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { UoMType, GoalSheetStatus } from '@prisma/client';
import {
  CreateUserInput,
  UpdateUserInput,
  CreateCycleInput,
  UpdateCycleInput,
  CreateThrustAreaInput,
  CreateSharedGoalInput,
  PushSharedGoalInput,
} from './admin.schema';

export class AdminService {
  // ===== USER MANAGEMENT =====

  async getAllUsers() {
    return prisma.user.findMany({
      include: {
        department: true,
        manager: { select: { id: true, name: true, email: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createUser(data: CreateUserInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { employeeCode: data.employeeCode }],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or employee code already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        passwordHash,
      },
      include: {
        department: true,
        manager: { select: { id: true, name: true } },
      },
    });

    return user;
  }

  async updateUser(userId: string, data: UpdateUserInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      include: {
        department: true,
        manager: { select: { id: true, name: true } },
      },
    });

    return user;
  }

  async deleteUser(userId: string) {
    await prisma.user.delete({ where: { id: userId } });
    return { message: 'User deleted successfully' };
  }

  // ===== CYCLE MANAGEMENT =====

  async getAllCycles() {
    return prisma.cycle.findMany({
      include: {
        thrustAreas: true,
        _count: { select: { goalSheets: true } },
      },
      orderBy: { year: 'desc' },
    });
  }

  async createCycle(data: CreateCycleInput) {
    const cycle = await prisma.cycle.create({
      data: {
        ...data,
        goalSettingOpen: new Date(data.goalSettingOpen),
        goalSettingClose: new Date(data.goalSettingClose),
      },
    });

    return cycle;
  }

  async updateCycle(cycleId: string, data: UpdateCycleInput) {
    const updateData: any = { ...data };
    if (data.goalSettingOpen) {
      updateData.goalSettingOpen = new Date(data.goalSettingOpen);
    }
    if (data.goalSettingClose) {
      updateData.goalSettingClose = new Date(data.goalSettingClose);
    }

    const cycle = await prisma.cycle.update({
      where: { id: cycleId },
      data: updateData,
    });

    return cycle;
  }

  async activateCycle(cycleId: string) {
    // Deactivate all other cycles
    await prisma.cycle.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate this cycle
    const cycle = await prisma.cycle.update({
      where: { id: cycleId },
      data: { isActive: true },
    });

    return cycle;
  }

  // ===== THRUST AREA MANAGEMENT =====

  async createThrustArea(data: CreateThrustAreaInput) {
    return prisma.thrustArea.create({
      data,
      include: { cycle: true },
    });
  }

  async updateThrustArea(thrustAreaId: string, data: { name?: string; description?: string; isActive?: boolean }) {
    return prisma.thrustArea.update({
      where: { id: thrustAreaId },
      data,
    });
  }

  // ===== SHARED GOALS =====

  async getAllSharedGoals(cycleId?: string) {
    const where: any = {};
    if (cycleId) {
      where.cycleId = cycleId;
    }

    return prisma.sharedGoal.findMany({
      where,
      include: {
        goals: {
          include: {
            goalSheet: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        _count: { select: { goals: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSharedGoal(data: CreateSharedGoalInput, createdById: string) {
    const sharedGoal = await prisma.sharedGoal.create({
      data: {
        ...data,
        uomType: data.uomType as UoMType,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        createdById,
      },
    });

    return sharedGoal;
  }

  async pushSharedGoal(data: PushSharedGoalInput) {
    const sharedGoal = await prisma.sharedGoal.findUnique({
      where: { id: data.sharedGoalId },
    });

    if (!sharedGoal) {
      throw new Error('Shared goal not found');
    }

    // Get or create goal sheets for users
    const results = await Promise.all(
      data.userIds.map(async (userId) => {
        // Get or create goal sheet
        let goalSheet = await prisma.goalSheet.findUnique({
          where: {
            userId_cycleId: {
              userId,
              cycleId: sharedGoal.cycleId,
            },
          },
          include: { goals: true },
        });

        if (!goalSheet) {
          goalSheet = await prisma.goalSheet.create({
            data: {
              userId,
              cycleId: sharedGoal.cycleId,
            },
            include: { goals: true },
          });
        }

        // Check if goal sheet is locked
        if (goalSheet.isLocked) {
          return { userId, success: false, reason: 'Goal sheet is locked' };
        }

        // Check if already has this shared goal
        const existingGoal = goalSheet.goals.find((g) => g.sharedGoalId === data.sharedGoalId);
        if (existingGoal) {
          return { userId, success: false, reason: 'Shared goal already exists' };
        }

        // Add goal
        const sortOrder = goalSheet.goals.length;
        await prisma.goal.create({
          data: {
            goalSheetId: goalSheet.id,
            thrustAreaId: sharedGoal.thrustAreaId,
            title: sharedGoal.title,
            description: sharedGoal.description,
            uomType: sharedGoal.uomType,
            target: sharedGoal.target,
            targetDate: sharedGoal.targetDate,
            weightage: data.weightage,
            isShared: true,
            sharedGoalId: data.sharedGoalId,
            isTitleLocked: true,
            isTargetLocked: true,
            sortOrder,
          },
        });

        // Update total weightage
        const newTotal = goalSheet.goals.reduce((sum, g) => sum + g.weightage, 0) + data.weightage;
        await prisma.goalSheet.update({
          where: { id: goalSheet.id },
          data: { totalWeightage: newTotal },
        });

        return { userId, success: true };
      })
    );

    return results;
  }

  // ===== COMPLETION DASHBOARD =====

  async getCompletionDashboard(cycleId?: string) {
    const where: any = {};
    if (cycleId) {
      where.cycleId = cycleId;
    }

    // Total goal sheets
    const totalGoalSheets = await prisma.goalSheet.count({ where });

    // Goal sheets by status
    const statusCounts = await prisma.goalSheet.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Check-in completion by quarter
    const checkinWindows = await prisma.checkinWindow.findMany({
      where: cycleId ? { cycleId } : {},
      include: {
        _count: {
          select: {
            checkins: true,
          },
        },
        checkins: {
          where: { status: 'REVIEWED' },
        },
      },
    });

    const checkinCompletion = checkinWindows.map((window) => ({
      quarter: window.quarter,
      label: window.label,
      total: window._count.checkins,
      reviewed: window.checkins.length,
      percentage: window._count.checkins > 0 ? Math.round((window.checkins.length / window._count.checkins) * 100) : 0,
    }));

    // Department-wise summary
    const departments = await prisma.department.findMany({
      include: {
        users: {
          include: {
            goalSheets: {
              where,
              include: { goals: true },
            },
          },
        },
      },
    });

    const departmentSummary = departments.map((dept) => {
      const totalSheets = dept.users.reduce((sum, user) => sum + user.goalSheets.length, 0);
      const approvedSheets = dept.users.reduce(
        (sum, user) => sum + user.goalSheets.filter((s) => s.status === GoalSheetStatus.APPROVED).length,
        0
      );

      return {
        id: dept.id,
        name: dept.name,
        totalEmployees: dept.users.length,
        totalGoalSheets: totalSheets,
        approvedGoalSheets: approvedSheets,
        approvalRate: totalSheets > 0 ? Math.round((approvedSheets / totalSheets) * 100) : 0,
      };
    });

    return {
      totalGoalSheets,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      checkinCompletion,
      departmentSummary,
    };
  }

  // ===== DEPARTMENTS =====

  async getAllDepartments() {
    return prisma.department.findMany({
      include: {
        manager: { select: { id: true, name: true, email: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(data: { name: string; code: string; managerId?: string }) {
    return prisma.department.create({
      data,
      include: {
        manager: { select: { id: true, name: true } },
      },
    });
  }

  async updateDepartment(deptId: string, data: { name?: string; code?: string; managerId?: string }) {
    return prisma.department.update({
      where: { id: deptId },
      data,
      include: {
        manager: { select: { id: true, name: true } },
      },
    });
  }
}
