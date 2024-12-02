import { desc, eq, lte, sql } from 'drizzle-orm';
import db from '../db';
import { pointTransactions } from '../db/schema/points.schema';
import {
  AddPoints,
  CurrentLevel,
  CurrentPoints,
  CurrentStreak,
  PointTransaction,
} from '../types/game.types';
import { streaks } from '../db/schema/streaks.schema';
import { levels, userLevels } from '../db/schema/levels.schema';

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
        points: sql`sum(${pointTransactions.points})`.mapWith(Number),
      })
      .from(pointTransactions)
      .where(eq(pointTransactions.userId, userId));

    return currentPoints;
  }

  public static async updateStreak(userId: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [currentStreak] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, userId));

    if (!currentStreak) {
      await db.insert(streaks).values({
        userId,
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

  public static async getCurrentStreak(userId: number): Promise<CurrentStreak> {
    const [currentStreak] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, userId));

    return currentStreak;
  }

  public static async updateLevel(userId: number): Promise<void> {
    const currentPoints = await this.getCurrentPoints(userId);
    const currentLevel = await this.getCurrentLevel(userId);

    const [nextLevel] = await db
      .select()
      .from(levels)
      .where(lte(levels.pointsRequired, currentPoints.points))
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

    if (!currentLevel) {
      await db.insert(userLevels).values({ userId, levelId: 1 }).returning();

      const [levelDetails] = await db
        .select()
        .from(levels)
        .where(eq(levels.level, 1));

      return {
        currentLevel: levelDetails.level,
        currentPoints: 0,
        nextLevel: levelDetails.level + 1,
        pointsRequired: levelDetails.pointsRequired,
      };
    }

    return {
      currentLevel: currentLevel.level.level,
      currentPoints: currentLevel.level.pointsRequired,
      nextLevel: currentLevel.level.level + 1,
      pointsRequired: currentLevel.level.pointsRequired,
    };
  }
}
