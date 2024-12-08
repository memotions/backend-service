import { and, asc, desc, eq, lte, sql } from 'drizzle-orm';
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
import AppError from '../utils/appError';
import EmotionAnalysisService from './emotionsAnalysis.service';

export default class GameService {
  public static async addPoints(
    userId: number,
    points: AddPoints,
  ): Promise<PointTransaction> {
    const [newPoints] = await db
      .insert(pointTransactions)
      .values({ userId, ...points })
      .returning();

    await this.updateLevel(userId);

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
    category: 'JOURNAL_STREAK' | 'POSITIVE_STREAK',
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let [currentStreak] = await db
      .select()
      .from(streaks)
      .where(and(eq(streaks.userId, userId), eq(streaks.category, category)));

    if (!currentStreak) {
      [currentStreak] = await db
        .insert(streaks)
        .values({
          userId,
          category,
          startDate: today,
          endDate: today,
        })
        .returning();
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
        })
        .where(eq(streaks.id, currentStreak.id));
    } else if (differenceInDays > 1) {
      await db
        .update(streaks)
        .set({
          startDate: today,
          endDate: today,
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

    if (!currentStreak) {
      return {
        startDate: new Date(),
        endDate: new Date(),
        streakLength: 0,
      };
    }

    const startDate = new Date(currentStreak.startDate);
    const endDate = new Date(currentStreak.endDate);
    const streakLength =
      Math.floor(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    return {
      startDate,
      endDate,
      streakLength,
    };
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
        totalPoints: currentPoints.totalPoints,
        nextLevel: levelDetails.level + 1,
        pointsRequired: levelDetails.pointsRequired,
      };
    }

    const [nextLevelDetails] = await db
      .select()
      .from(levels)
      .where(eq(levels.level, currentLevel.level.level + 1));

    return {
      currentLevel: currentLevel.level.level,
      totalPoints: currentPoints.totalPoints,
      nextLevel: nextLevelDetails.level,
      pointsRequired: nextLevelDetails.pointsRequired,
    };
  }

  public static async getAllAchievements(
    userId: number,
  ): Promise<Achievement[]> {
    const allAchievements = await db
      .select()
      .from(achievements)
      .leftJoin(
        userAchievements,
        and(
          eq(achievements.id, userAchievements.achievementId),
          eq(userAchievements.userId, userId),
        ),
      )
      .orderBy(asc(achievements.id));

    return allAchievements.map(item => ({
      ...item.achievements,
      completed:
        item.user_achievements !== null || item.achievements.tier === 0,
    }));
  }

  public static async getAchievementById(
    userId: number,
    id: number,
  ): Promise<Achievement> {
    const [achievement] = await db
      .select()
      .from(achievements)
      .leftJoin(
        userAchievements,
        and(
          eq(achievements.id, userAchievements.achievementId),
          eq(userAchievements.userId, userId),
        ),
      )
      .where(eq(achievements.id, id))
      .limit(1);

    if (!achievement) {
      throw new AppError('ACHIEVEMENT_NOT_FOUND', 404, 'Achievement not found');
    }

    return {
      ...achievement.achievements,
      completed: achievement.user_achievements !== null,
    };
  }

  public static async getAchivementsCount(userId: number): Promise<{
    total: number;
    completed: number;
  }> {
    const allAchievements = await this.getAllAchievements(userId);

    return {
      total: allAchievements.length,
      completed: allAchievements.filter(item => item.completed).length,
    };
  }

  public static async getStats(userId: number): Promise<Stats> {
    const currentLevel = await this.getCurrentLevel(userId);
    const currentStreak = await this.getCurrentStreak(userId);
    const journalCount = await JournalsService.getJournalsCount(userId);
    const achievementCount = await this.getAchivementsCount(userId);
    const emotionCount = await EmotionAnalysisService.getEmotionsCount(userId);

    return {
      currentLevel,
      currentStreak,
      journalCount,
      achievementCount,
      emotionCount,
    };
  }
}
