import { and, desc, eq, lte, sql } from 'drizzle-orm';
import db from '../db';
import { pointTransactions } from '../db/schema/points.schema';
import {
  Achievement,
  AddPoints,
  CurrentLevel,
  CurrentPoints,
  CurrentStreak,
  PointTransaction,
  Stats,
} from '../types/game.types';
import { streaks } from '../db/schema/streaks.schema';
import { levels, userLevels } from '../db/schema/levels.schema';
import JournalsService from './journals.service';
import {
  achievements,
  userAchievements,
} from '../db/schema/achievements.schema';

export default class GameService {
  public static async addPoints(
    userId: number,
    points: AddPoints,
  ): Promise<PointTransaction> {
    const [newPoints] = await db
      .insert(pointTransactions)
      .values({ userId, ...points })
      .returning();

    return newPoints;
  }

  public static async getCurrentPoints(userId: number): Promise<CurrentPoints> {
    const [currentPoints] = await db
      .select({
        totalPoints: sql`sum(${pointTransactions.points})`.mapWith(Number),
      })
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId));

    return currentPoints;
  }

  public static async updateStreak(
    userId: number,
    category: string,
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [currentStreak] = await db
      .select()
      .from(streaks)
      .where(and(eq(streaks.userId, userId), eq(streaks.category, category)));

    if (!currentStreak) {
      await db.insert(streaks).values({
        userId,
        category,
        startDate: today,
        endDate: today,
        streakLength: 1,
      });
    }

    const lastEntryDate = new Date(currentStreak.endDate);
    lastEntryDate.setHours(0, 0, 0, 0);

    const differenceInDays = Math.floor(
      (today.getTime() - lastEntryDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (differenceInDays === 1) {
      await db
        .update(streaks)
        .set({
          endDate: today,
          streakLength: currentStreak.streakLength + 1,
        })
        .where(eq(streaks.id, currentStreak.id));
    } else if (differenceInDays > 1) {
      await db
        .update(streaks)
        .set({
          startDate: today,
          endDate: today,
          streakLength: 1,
        })
        .where(eq(streaks.id, currentStreak.id));
    }
  }

  public static async getCurrentStreak(
    userId: number,
    category?: 'JOURNAL_STREAK' | 'POSITIVE_STREAK',
  ): Promise<CurrentStreak> {
    const [currentStreak] = await db
      .select()
      .from(streaks)
      .where(
        and(
          eq(streaks.userId, userId),
          category ? eq(streaks.category, category) : undefined,
        ),
      );

    return currentStreak;
  }

  public static async updateLevel(userId: number): Promise<void> {
    const currentPoints = await this.getCurrentPoints(userId);
    const currentLevel = await this.getCurrentLevel(userId);

    const [nextLevel] = await db
      .select()
      .from(levels)
      .where(lte(levels.pointsRequired, currentPoints.totalPoints))
      .orderBy(desc(levels.level))
      .limit(1);

    if (nextLevel && nextLevel.level > currentLevel.currentLevel) {
      await db
        .update(userLevels)
        .set({ levelId: nextLevel.level })
        .where(eq(userLevels.userId, userId));
    }
  }

  public static async getCurrentLevel(userId: number): Promise<CurrentLevel> {
    const currentLevel = await db.query.userLevels.findFirst({
      where: eq(userLevels.userId, userId),
      with: {
        level: true,
      },
    });

    const currentPoints = await this.getCurrentPoints(userId);

    if (!currentLevel) {
      await db.insert(userLevels).values({ userId, levelId: 1 }).returning();

      const [levelDetails] = await db
        .select()
        .from(levels)
        .where(eq(levels.level, 1));

      return {
        currentLevel: levelDetails.level,
        totalPoints: 0,
        nextLevel: levelDetails.level + 1,
        pointsRequired: levelDetails.pointsRequired,
      };
    }

    return {
      currentLevel: currentLevel.level.level,
      totalPoints: currentPoints.totalPoints,
      nextLevel: currentLevel.level.level + 1,
      pointsRequired: currentLevel.level.pointsRequired,
    };
  }

  public static async getAchievements(userId: number): Promise<Achievement[]> {
    const allAchievements = await db
      .select({
        achievement: achievements,
        completedAt: userAchievements.completedAt,
      })
      .from(achievements)
      .leftJoin(
        userAchievements,
        eq(userAchievements.achievementId, achievements.id),
      )
      .where(eq(userAchievements.userId, userId));

    return allAchievements.map(item => ({
      ...item.achievement,
      completed: !!item.completedAt,
    }));
  }

  public static async getStats(userId: number): Promise<Stats> {
    const currentLevel = await this.getCurrentLevel(userId);
    const currentStreak = await this.getCurrentStreak(userId);
    const journalsCount = await JournalsService.getJournalsCount(userId);

    return {
      currentLevel,
      currentStreak,
      journalsCount,
      achievementsCount: {
        total: 0,
        completed: 0,
      },
      emotions: {
        happy: 0,
        sad: 0,
        neutral: 0,
        angry: 0,
        scared: 0,
      },
    };
  }
}
