import { UoMType, Goal } from '@prisma/client';

export interface AchievementData {
  actualValue?: number | null;
  actualDate?: Date | null;
}

/**
 * Calculate progress score based on UoM type
 * Returns a score between 0-100
 */
export function calculateProgressScore(
  goal: { uomType: UoMType; target: number; targetDate?: Date | null },
  achievement: AchievementData
): number {
  switch (goal.uomType) {
    case UoMType.NUMERIC_MIN: {
      // Higher is better (e.g., increase revenue by 25%)
      if (!achievement.actualValue || achievement.actualValue === 0) return 0;
      const score = (achievement.actualValue / goal.target) * 100;
      return Math.min(score, 100);
    }

    case UoMType.NUMERIC_MAX: {
      // Lower is better (e.g., reduce bugs to under 10)
      if (!achievement.actualValue) return 0;
      if (achievement.actualValue === 0) return 100;
      const score = (goal.target / achievement.actualValue) * 100;
      return Math.min(score, 100);
    }

    case UoMType.TIMELINE: {
      // Date-based (e.g., launch feature by Q2)
      if (!achievement.actualDate || !goal.targetDate) return 0;
      
      const targetTime = goal.targetDate.getTime();
      const actualTime = achievement.actualDate.getTime();
      
      // Completed on or before target date = 100%
      if (actualTime <= targetTime) return 100;
      
      // Calculate days late
      const daysLate = Math.floor((actualTime - targetTime) / (1000 * 60 * 60 * 24));
      
      // 5% penalty per day late, minimum 0%
      const score = Math.max(0, 100 - daysLate * 5);
      return score;
    }

    case UoMType.ZERO: {
      // Zero = success (e.g., zero security incidents)
      if (achievement.actualValue === undefined || achievement.actualValue === null) return 0;
      return achievement.actualValue === 0 ? 100 : 0;
    }

    default:
      return 0;
  }
}

/**
 * Calculate weighted score for entire goal sheet
 */
export function calculateWeightedScore(
  goals: Array<{ weightage: number; progressScore: number | null }>
): number {
  const totalScore = goals.reduce((sum, goal) => {
    const score = goal.progressScore || 0;
    return sum + (score * goal.weightage) / 100;
  }, 0);
  
  return Math.round(totalScore * 100) / 100; // Round to 2 decimals
}
