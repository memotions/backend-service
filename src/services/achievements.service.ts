import { desc, eq, inArray } from 'drizzle-orm';
import db from '../db';
import {
  achievements,
  userAchievements,
} from '../db/schema/achievements.schema';
import JournalsService from './journals.service';
import GameService from './game.service';
import EmotionAnalysisService from './emotionsAnalysis.service';
import { Achievement } from '../types/game.types';

export default class AchievementsService {
  private static async addUserAchievement(
    userId: number,
    achievementId: number,
    pointsAwarded: number,
  ): Promise<Achievement> {
    await db
      .insert(userAchievements)
      .values({ userId, achievementId })
      .onConflictDoNothing()
      .returning();

    const [newAchievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.id, achievementId))
      .limit(1);

    await GameService.addPoints(userId, {
      points: pointsAwarded,
      type: 'ACHIEVEMENT_BONUS',
    });

    return { ...newAchievement, completed: true };
  }

  public static async processOnUserRegistered(
    userId: number,
  ): Promise<Achievement | null> {
    const [registerAchievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievements.type, 'REGISTER'))
      .limit(1);

    const [existingAchievement] = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    if (!existingAchievement) {
      const achievement = await this.addUserAchievement(
        userId,
        registerAchievement.id,
        registerAchievement.pointsAwarded,
      );

      return achievement;
    }

    return null;
  }

  public static async processOnJournalPublished(
    userId: number,
  ): Promise<Achievement[]> {
    const journalAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.type, 'JOURNAL_COUNT'))
      .orderBy(desc(achievements.tier));

    const journalsCount = await JournalsService.getJournalsCount(userId);

    const newAchievements = await Promise.all(
      journalAchievements
        .filter(achievement => journalsCount >= achievement.criteria)
        .map(async achievement =>
          this.addUserAchievement(
            userId,
            achievement.id,
            achievement.pointsAwarded,
          ),
        ),
    );

    return newAchievements.filter(Boolean);
  }

  public static async processOnStreakUpdated(
    userId: number,
  ): Promise<Achievement[]> {
    const streakAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.type, 'JOURNAL_STREAK'));

    const currentStreak = await GameService.getCurrentStreak(userId);

    const newAchievements = await Promise.all(
      streakAchievements
        .filter(
          achievement => currentStreak.streakLength >= achievement.criteria,
        )
        .map(async achievement =>
          this.addUserAchievement(
            userId,
            achievement.id,
            achievement.pointsAwarded,
          ),
        ),
    );

    return newAchievements.filter(Boolean);
  }

  public static async processOnLevelUpdated(
    userId: number,
  ): Promise<Achievement[]> {
    const levelAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.type, 'LEVEL'));

    const currentLevel = await GameService.getCurrentLevel(userId);

    const newAchievements = await Promise.all(
      levelAchievements
        .filter(
          achievement => currentLevel.currentLevel >= achievement.criteria,
        )
        .map(async achievement =>
          this.addUserAchievement(
            userId,
            achievement.id,
            achievement.pointsAwarded,
          ),
        ),
    );

    return newAchievements.filter(Boolean);
  }

  public static async processOnJournalAnalyzed(
    userId: number,
  ): Promise<Achievement[]> {
    const emotionsAchievements = await db
      .select()
      .from(achievements)
      .where(
        inArray(achievements.type, [
          'POSITIVE_COUNT',
          'RISE_COUNT',
          'POSITIVE_STREAK',
        ]),
      );

    const [positiveCount, riseCount, positiveStreak] = await Promise.all([
      EmotionAnalysisService.getPositiveCount(userId),
      EmotionAnalysisService.getRiseCount(userId),
      GameService.getCurrentStreak(userId, 'POSITIVE_STREAK'),
    ]);

    const newAchievements = await Promise.all(
      emotionsAchievements
        .filter(achievement => {
          switch (achievement.type) {
            case 'POSITIVE_COUNT':
              return positiveCount >= achievement.criteria;
            case 'RISE_COUNT':
              return riseCount >= achievement.criteria;
            case 'POSITIVE_STREAK':
              return positiveStreak.streakLength >= achievement.criteria;
            default:
              return false;
          }
        })
        .map(async achievement =>
          this.addUserAchievement(
            userId,
            achievement.id,
            achievement.pointsAwarded,
          ),
        ),
    );

    return newAchievements.filter(Boolean);
  }
}
