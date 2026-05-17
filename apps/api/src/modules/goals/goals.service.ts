import prisma from '../../lib/prisma';
import { GoalSheetStatus } from '@prisma/client';
import { CreateGoalSheetInput, CreateGoalInput, UpdateGoalInput, ValidateWeightageInput } from './goals.schema';

export class GoalsService {
  // Validate weightage sum = 100%
  validateWeightage(goals: { weightage: number }[]): { valid: boolean; total: number; message?: string } {
    if (goals.length === 0) {
      return { valid: false, total: 0, message: 'At least one goal is required' };
    }

    if (goals.length > 8) {
      return { valid: false, total: 0, message: 'Maximum 8 goals allowed' };
    }

    const total = goals.reduce((sum, g) => sum + g.weightage, 0);

    if (Math.abs(total - 100) > 0.01) {
      return { valid: false, total, message: `Total weightage must be 100% (currently ${total.toFixed(2)}%)` };
    }

    return { valid: true, total };
  }

  // Get or create goal sheet for user and cycle
  async getOrCreateGoalSheet(userId: string, cycleId: string) {
    let goalSheet = await prisma.goalSheet.findUnique({
      where: { userId_cycleId: { userId, cycleId } },
      include: {
        goals: { include: { thrustArea: true }, orderBy: { sortOrder: 'asc' } },
        cycle: true,
        user: { select: { id: true, name: true, email: true, employeeCode: true } },
      },
    });

    if (!goalSheet) {
      goalSheet = await prisma.goalSheet.create({
        data: { userId, cycleId },
        include: {
          goals: { include: { thrustArea: true }, orderBy: { sortOrder: 'asc' } },
          cycle: true,
          user: { select: { id: true, name: true, email: true, employeeCode: true } },
        },
      });
    }

    return goalSheet;
  }

  // Get goal sheet by ID
  async getGoalSheetById(id: string, userId: string, role: string) {
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id },
      include: {
        goals: { include: { thrustArea: true }, orderBy: { sortOrder: 'asc' } },
        cycle: true,
        user: { select: { id: true, name: true, email: true, employeeCode: true, manager: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!goalSheet) {
      throw new Error('Goal sheet not found');
    }

    // Access control
    if (role === 'EMPLOYEE' && goalSheet.userId !== userId) {
      throw new Error('Access denied');
    }

    if (role === 'MANAGER') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (goalSheet.user.manager?.id !== userId && goalSheet.userId !== userId) {
        throw new Error('Access denied');
      }
    }

    return goalSheet;
  }

  // Get all goal sheets for user
  async getMyGoalSheets(userId: string) {
    return prisma.goalSheet.findMany({
      where: { userId },
      include: {
        goals: { include: { thrustArea: true }, orderBy: { sortOrder: 'asc' } },
        cycle: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Add goal to sheet
  async addGoal(goalSheetId: string, userId: string, data: CreateGoalInput) {
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: goalSheetId },
      include: { goals: true },
    });

    if (!goalSheet) {
      throw new Error('Goal sheet not found');
    }

    if (goalSheet.userId !== userId) {
      throw new Error('Access denied');
    }

    if (goalSheet.isLocked) {
      throw new Error('Cannot modify locked goal sheet');
    }

    if (goalSheet.status !== GoalSheetStatus.DRAFT && goalSheet.status !== GoalSheetStatus.RETURNED) {
      throw new Error('Can only add goals to draft or returned goal sheets');
    }

    if (goalSheet.goals.length >= 8) {
      throw new Error('Maximum 8 goals allowed per sheet');
    }

    const sortOrder = goalSheet.goals.length;

    const goal = await prisma.goal.create({
      data: {
        ...data,
        goalSheetId,
        sortOrder,
      },
      include: { thrustArea: true },
    });

    // Update total weightage
    const newTotal = goalSheet.goals.reduce((sum, g) => sum + g.weightage, 0) + data.weightage;
    await prisma.goalSheet.update({
      where: { id: goalSheetId },
      data: { totalWeightage: newTotal },
    });

    return goal;
  }

  // Update goal
  async updateGoal(goalId: string, userId: string, data: UpdateGoalInput) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { goalSheet: true },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    if (goal.goalSheet.userId !== userId) {
      throw new Error('Access denied');
    }

    if (goal.goalSheet.isLocked) {
      throw new Error('Cannot modify locked goal sheet');
    }

    if (goal.goalSheet.status !== GoalSheetStatus.DRAFT && goal.goalSheet.status !== GoalSheetStatus.RETURNED) {
      throw new Error('Can only update goals in draft or returned goal sheets');
    }

    if (goal.isTitleLocked && data.title) {
      throw new Error('Goal title is locked');
    }

    if (goal.isTargetLocked && (data.target || data.targetDate)) {
      throw new Error('Goal target is locked');
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data,
      include: { thrustArea: true },
    });

    // Recalculate total weightage if weightage changed
    if (data.weightage !== undefined) {
      const allGoals = await prisma.goal.findMany({
        where: { goalSheetId: goal.goalSheetId },
      });
      const newTotal = allGoals.reduce((sum, g) => sum + g.weightage, 0);
      await prisma.goalSheet.update({
        where: { id: goal.goalSheetId },
        data: { totalWeightage: newTotal },
      });
    }

    return updatedGoal;
  }

  // Delete goal
  async deleteGoal(goalId: string, userId: string) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { goalSheet: true },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    if (goal.goalSheet.userId !== userId) {
      throw new Error('Access denied');
    }

    if (goal.goalSheet.isLocked) {
      throw new Error('Cannot modify locked goal sheet');
    }

    if (goal.goalSheet.status !== GoalSheetStatus.DRAFT && goal.goalSheet.status !== GoalSheetStatus.RETURNED) {
      throw new Error('Can only delete goals from draft or returned goal sheets');
    }

    await prisma.goal.delete({ where: { id: goalId } });

    // Recalculate total weightage
    const allGoals = await prisma.goal.findMany({
      where: { goalSheetId: goal.goalSheetId },
    });
    const newTotal = allGoals.reduce((sum, g) => sum + g.weightage, 0);
    await prisma.goalSheet.update({
      where: { id: goal.goalSheetId },
      data: { totalWeightage: newTotal },
    });

    return { message: 'Goal deleted successfully' };
  }

  // Submit goal sheet for approval
  async submitGoalSheet(goalSheetId: string, userId: string) {
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: goalSheetId },
      include: { goals: true },
    });

    if (!goalSheet) {
      throw new Error('Goal sheet not found');
    }

    if (goalSheet.userId !== userId) {
      throw new Error('Access denied');
    }

    if (goalSheet.status !== GoalSheetStatus.DRAFT && goalSheet.status !== GoalSheetStatus.RETURNED) {
      throw new Error('Can only submit draft or returned goal sheets');
    }

    // Validate weightage
    const validation = this.validateWeightage(goalSheet.goals);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const updated = await prisma.goalSheet.update({
      where: { id: goalSheetId },
      data: {
        status: GoalSheetStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        goals: { include: { thrustArea: true } },
        cycle: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return updated;
  }
}
