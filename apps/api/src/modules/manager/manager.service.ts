import prisma from '../../lib/prisma';
import { GoalSheetStatus, AuditAction } from '@prisma/client';
import { ApproveGoalSheetInput, ReturnGoalSheetInput, ManagerUpdateGoalInput, UnlockGoalSheetInput } from './manager.schema';

export class ManagerService {
  // Get team members (direct reports)
  async getTeamMembers(managerId: string) {
    return prisma.user.findMany({
      where: { managerId },
      select: {
        id: true,
        name: true,
        email: true,
        employeeCode: true,
        department: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // Get pending approvals for manager
  async getPendingApprovals(managerId: string) {
    const teamMembers = await prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });

    const teamMemberIds = teamMembers.map(m => m.id);

    return prisma.goalSheet.findMany({
      where: {
        userId: { in: teamMemberIds },
        status: GoalSheetStatus.SUBMITTED,
      },
      include: {
        user: { select: { id: true, name: true, email: true, employeeCode: true } },
        goals: { include: { thrustArea: true }, orderBy: { sortOrder: 'asc' } },
        cycle: true,
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  // Get all team goal sheets
  async getTeamGoalSheets(managerId: string) {
    const teamMembers = await prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });

    const teamMemberIds = teamMembers.map(m => m.id);

    return prisma.goalSheet.findMany({
      where: { userId: { in: teamMemberIds } },
      include: {
        user: { select: { id: true, name: true, email: true, employeeCode: true } },
        goals: { include: { thrustArea: true }, orderBy: { sortOrder: 'asc' } },
        cycle: true,
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  // Manager inline edit goal (only target and weightage)
  async managerUpdateGoal(goalId: string, managerId: string, data: ManagerUpdateGoalInput, ipAddress?: string, userAgent?: string) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        goalSheet: {
          include: {
            user: { select: { id: true, managerId: true } },
          },
        },
      },
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Verify manager has access
    if (goal.goalSheet.user.managerId !== managerId) {
      throw new Error('Access denied: Not your direct report');
    }

    // Can only edit submitted sheets
    if (goal.goalSheet.status !== GoalSheetStatus.SUBMITTED) {
      throw new Error('Can only edit goals in submitted sheets');
    }

    // Store previous values for audit
    const previousValue = {
      target: goal.target,
      targetDate: goal.targetDate,
      weightage: goal.weightage,
    };

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data,
      include: { thrustArea: true },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'Goal',
        entityId: goalId,
        action: AuditAction.UPDATE,
        changedById: managerId,
        previousValue,
        newValue: data,
        ipAddress,
        userAgent,
      },
    });

    // Recalculate total weightage if changed
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

  // Approve goal sheet
  async approveGoalSheet(data: ApproveGoalSheetInput, managerId: string, ipAddress?: string, userAgent?: string) {
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: data.goalSheetId },
      include: {
        goals: true,
        user: { select: { id: true, managerId: true, name: true } },
      },
    });

    if (!goalSheet) {
      throw new Error('Goal sheet not found');
    }

    // Verify manager has access
    if (goalSheet.user.managerId !== managerId) {
      throw new Error('Access denied: Not your direct report');
    }

    if (goalSheet.status !== GoalSheetStatus.SUBMITTED) {
      throw new Error('Can only approve submitted goal sheets');
    }

    // Validate weightage
    const total = goalSheet.goals.reduce((sum, g) => sum + g.weightage, 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Cannot approve: Total weightage is ${total}%, must be 100%`);
    }

    // Approve and lock
    const approved = await prisma.goalSheet.update({
      where: { id: data.goalSheetId },
      data: {
        status: GoalSheetStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: managerId,
        isLocked: true,
        lockedAt: new Date(),
      },
      include: {
        goals: { include: { thrustArea: true } },
        user: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
        cycle: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'GoalSheet',
        entityId: data.goalSheetId,
        action: AuditAction.APPROVE,
        changedById: managerId,
        previousValue: { status: GoalSheetStatus.SUBMITTED },
        newValue: { status: GoalSheetStatus.APPROVED, isLocked: true },
        ipAddress,
        userAgent,
      },
    });

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: goalSheet.user.id,
        title: 'Goal Sheet Approved',
        body: `Your goal sheet has been approved by your manager`,
        type: 'GOAL_APPROVED',
        linkUrl: `/goals/${data.goalSheetId}`,
      },
    });

    return approved;
  }

  // Return goal sheet for rework
  async returnGoalSheet(data: ReturnGoalSheetInput, managerId: string, ipAddress?: string, userAgent?: string) {
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: data.goalSheetId },
      include: {
        user: { select: { id: true, managerId: true, name: true } },
      },
    });

    if (!goalSheet) {
      throw new Error('Goal sheet not found');
    }

    // Verify manager has access
    if (goalSheet.user.managerId !== managerId) {
      throw new Error('Access denied: Not your direct report');
    }

    if (goalSheet.status !== GoalSheetStatus.SUBMITTED) {
      throw new Error('Can only return submitted goal sheets');
    }

    const returned = await prisma.goalSheet.update({
      where: { id: data.goalSheetId },
      data: {
        status: GoalSheetStatus.RETURNED,
        returnedAt: new Date(),
        returnReason: data.reason,
      },
      include: {
        goals: { include: { thrustArea: true } },
        user: { select: { id: true, name: true, email: true } },
        cycle: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'GoalSheet',
        entityId: data.goalSheetId,
        action: AuditAction.REJECT,
        changedById: managerId,
        previousValue: { status: GoalSheetStatus.SUBMITTED },
        newValue: { status: GoalSheetStatus.RETURNED, reason: data.reason },
        reason: data.reason,
        ipAddress,
        userAgent,
      },
    });

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: goalSheet.user.id,
        title: 'Goal Sheet Returned',
        body: `Your goal sheet has been returned for rework: ${data.reason}`,
        type: 'GOAL_RETURNED',
        linkUrl: `/goals/${data.goalSheetId}`,
      },
    });

    return returned;
  }

  // Admin: Unlock goal sheet
  async unlockGoalSheet(data: UnlockGoalSheetInput, adminId: string, ipAddress?: string, userAgent?: string) {
    const goalSheet = await prisma.goalSheet.findUnique({
      where: { id: data.goalSheetId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!goalSheet) {
      throw new Error('Goal sheet not found');
    }

    if (!goalSheet.isLocked) {
      throw new Error('Goal sheet is not locked');
    }

    const unlocked = await prisma.goalSheet.update({
      where: { id: data.goalSheetId },
      data: {
        isLocked: false,
        status: GoalSheetStatus.DRAFT,
      },
      include: {
        goals: { include: { thrustArea: true } },
        user: { select: { id: true, name: true, email: true } },
        cycle: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'GoalSheet',
        entityId: data.goalSheetId,
        action: AuditAction.UNLOCK,
        changedById: adminId,
        previousValue: { isLocked: true, status: goalSheet.status },
        newValue: { isLocked: false, status: GoalSheetStatus.DRAFT },
        reason: data.reason,
        ipAddress,
        userAgent,
      },
    });

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: goalSheet.user.id,
        title: 'Goal Sheet Unlocked',
        body: `Your goal sheet has been unlocked by admin: ${data.reason}`,
        type: 'GOAL_UNLOCKED',
        linkUrl: `/goals/${data.goalSheetId}`,
      },
    });

    return unlocked;
  }
}
