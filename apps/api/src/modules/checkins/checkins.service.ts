import prisma from '../../lib/prisma';
import { CheckinStatus, GoalSheetStatus } from '@prisma/client';
import { calculateProgressScore } from '../../lib/score-calculator';
import { 
  UpdateAchievementInput, 
  BulkUpdateAchievementsInput, 
  SubmitCheckinInput,
  AddCheckinCommentInput,
  ReviewCheckinInput 
} from './checkins.schema';

export class CheckinsService {
  // Get active check-in window
  async getActiveCheckinWindow() {
    const now = new Date();
    
    const window = await prisma.checkinWindow.findFirst({
      where: {
        opensAt: { lte: now },
        closesAt: { gte: now },
        isActive: true,
      },
      include: { cycle: true },
    });

    return window;
  }

  // Get or create check-in for goal sheet and window
  async getOrCreateCheckin(goalSheetId: string, userId: string) {
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

    if (goalSheet.status !== GoalSheetStatus.APPROVED) {
      throw new Error('Can only create check-ins for approved goal sheets');
    }

    const activeWindow = await this.getActiveCheckinWindow();
    if (!activeWindow) {
      throw new Error('No active check-in window');
    }

    let checkin = await prisma.checkin.findUnique({
      where: {
        goalSheetId_checkinWindowId: {
          goalSheetId,
          checkinWindowId: activeWindow.id,
        },
      },
      include: {
        achievements: { include: { goal: { include: { thrustArea: true } } } },
        window: true,
        comments: { include: { author: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!checkin) {
      // Create check-in with achievements for all goals
      checkin = await prisma.checkin.create({
        data: {
          goalSheetId,
          checkinWindowId: activeWindow.id,
          employeeId: userId,
          achievements: {
            create: goalSheet.goals.map((goal) => ({
              goalId: goal.id,
              status: 'NOT_STARTED',
            })),
          },
        },
        include: {
          achievements: { include: { goal: { include: { thrustArea: true } } } },
          window: true,
          comments: { include: { author: { select: { id: true, name: true } } } },
        },
      });
    }

    return checkin;
  }

  // Update achievement
  async updateAchievement(achievementId: string, userId: string, data: UpdateAchievementInput) {
    const achievement = await prisma.achievement.findUnique({
      where: { id: achievementId },
      include: {
        checkin: { include: { goalSheet: true } },
        goal: true,
      },
    });

    if (!achievement) {
      throw new Error('Achievement not found');
    }

    if (achievement.checkin.employeeId !== userId) {
      throw new Error('Access denied');
    }

    if (achievement.checkin.status === CheckinStatus.REVIEWED) {
      throw new Error('Cannot modify reviewed check-in');
    }

    // Calculate progress score
    const progressScore = calculateProgressScore(achievement.goal, {
      actualValue: data.actualValue ?? achievement.actualValue,
      actualDate: data.actualDate ? new Date(data.actualDate) : achievement.actualDate,
    });

    const updated = await prisma.achievement.update({
      where: { id: achievementId },
      data: {
        ...data,
        actualDate: data.actualDate ? new Date(data.actualDate) : undefined,
        progressScore,
      },
      include: { goal: { include: { thrustArea: true } } },
    });

    return updated;
  }

  // Bulk update achievements
  async bulkUpdateAchievements(checkinId: string, userId: string, data: BulkUpdateAchievementsInput) {
    const checkin = await prisma.checkin.findUnique({
      where: { id: checkinId },
      include: { achievements: { include: { goal: true } } },
    });

    if (!checkin) {
      throw new Error('Check-in not found');
    }

    if (checkin.employeeId !== userId) {
      throw new Error('Access denied');
    }

    if (checkin.status === CheckinStatus.REVIEWED) {
      throw new Error('Cannot modify reviewed check-in');
    }

    // Update each achievement
    const updates = await Promise.all(
      data.achievements.map(async (achData) => {
        const achievement = checkin.achievements.find((a) => a.goalId === achData.goalId);
        if (!achievement) {
          throw new Error(`Achievement not found for goal ${achData.goalId}`);
        }

        const progressScore = calculateProgressScore(achievement.goal, {
          actualValue: achData.actualValue,
          actualDate: achData.actualDate ? new Date(achData.actualDate) : null,
        });

        return prisma.achievement.update({
          where: { id: achievement.id },
          data: {
            actualValue: achData.actualValue,
            actualDate: achData.actualDate ? new Date(achData.actualDate) : undefined,
            status: achData.status,
            notes: achData.notes,
            progressScore,
          },
          include: { goal: { include: { thrustArea: true } } },
        });
      })
    );

    return updates;
  }

  // Submit check-in
  async submitCheckin(data: SubmitCheckinInput, userId: string) {
    const checkin = await prisma.checkin.findUnique({
      where: { id: data.checkinId },
      include: { achievements: true },
    });

    if (!checkin) {
      throw new Error('Check-in not found');
    }

    if (checkin.employeeId !== userId) {
      throw new Error('Access denied');
    }

    if (checkin.status !== CheckinStatus.OPEN) {
      throw new Error('Check-in already submitted');
    }

    const updated = await prisma.checkin.update({
      where: { id: data.checkinId },
      data: {
        status: CheckinStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        achievements: { include: { goal: { include: { thrustArea: true } } } },
        window: true,
        goalSheet: { include: { user: { select: { id: true, name: true, managerId: true } } } },
      },
    });

    // Create notification for manager
    if (updated.goalSheet.user.managerId) {
      await prisma.notification.create({
        data: {
          userId: updated.goalSheet.user.managerId,
          title: 'Check-in Submitted',
          body: `${updated.goalSheet.user.name} has submitted their ${updated.window.label}`,
          type: 'CHECKIN_SUBMITTED',
          linkUrl: `/manager/checkins/${data.checkinId}`,
        },
      });
    }

    return updated;
  }

  // Add comment to check-in
  async addComment(data: AddCheckinCommentInput, userId: string, role: string) {
    const checkin = await prisma.checkin.findUnique({
      where: { id: data.checkinId },
      include: { goalSheet: { include: { user: true } } },
    });

    if (!checkin) {
      throw new Error('Check-in not found');
    }

    // Access control
    const isEmployee = checkin.employeeId === userId;
    const isManager = role === 'MANAGER' && checkin.goalSheet.user.managerId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isEmployee && !isManager && !isAdmin) {
      throw new Error('Access denied');
    }

    const comment = await prisma.checkinComment.create({
      data: {
        checkinId: data.checkinId,
        authorId: userId,
        content: data.content,
        isManagerComment: data.isManagerComment && (isManager || isAdmin),
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
      },
    });

    return comment;
  }

  // Manager: Review check-in
  async reviewCheckin(data: ReviewCheckinInput, managerId: string) {
    const checkin = await prisma.checkin.findUnique({
      where: { id: data.checkinId },
      include: { goalSheet: { include: { user: true } } },
    });

    if (!checkin) {
      throw new Error('Check-in not found');
    }

    if (checkin.goalSheet.user.managerId !== managerId) {
      throw new Error('Access denied: Not your direct report');
    }

    if (checkin.status !== CheckinStatus.SUBMITTED) {
      throw new Error('Can only review submitted check-ins');
    }

    const reviewed = await prisma.checkin.update({
      where: { id: data.checkinId },
      data: {
        status: CheckinStatus.REVIEWED,
        reviewedAt: new Date(),
        reviewedById: managerId,
      },
      include: {
        achievements: { include: { goal: { include: { thrustArea: true } } } },
        window: true,
        comments: { include: { author: { select: { id: true, name: true } } } },
      },
    });

    // Create notification for employee
    await prisma.notification.create({
      data: {
        userId: checkin.employeeId,
        title: 'Check-in Reviewed',
        body: `Your ${reviewed.window.label} has been reviewed by your manager`,
        type: 'CHECKIN_REVIEWED',
        linkUrl: `/checkins/${data.checkinId}`,
      },
    });

    return reviewed;
  }

  // Get team check-ins for manager
  async getTeamCheckins(managerId: string, windowId?: string) {
    const teamMembers = await prisma.user.findMany({
      where: { managerId },
      select: { id: true },
    });

    const teamMemberIds = teamMembers.map((m) => m.id);

    const where: any = { employeeId: { in: teamMemberIds } };
    if (windowId) {
      where.checkinWindowId = windowId;
    }

    return prisma.checkin.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, email: true, employeeCode: true } },
        window: true,
        goalSheet: { include: { goals: true } },
        achievements: { include: { goal: true } },
        comments: { include: { author: { select: { id: true, name: true } } } },
      },
      orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }],
    });
  }

  // Get my check-ins
  async getMyCheckins(userId: string) {
    return prisma.checkin.findMany({
      where: { employeeId: userId },
      include: {
        window: true,
        goalSheet: { include: { goals: true } },
        achievements: { include: { goal: { include: { thrustArea: true } } } },
        comments: { include: { author: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
