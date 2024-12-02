import { eq } from 'drizzle-orm';
import db from '../db';
import {
  achievements,
  achievementTypes,
  userAchievements,
} from '../db/schema/achievements.schema';
import JournalsService from './journals.service';
import GameService from './game.service';

export default class AchievementsService {
  private static async addUserAchievement(
    userId: number,
    achievementId: number,
  ) {
    await db.insert(userAchievements).values({ userId, achievementId });
  }

  public static async processOnUserRegistered(userId: number): Promise<void> {
    const [registerAchievement] = await db
      .select()
      .from(achievements)
      .where(eq(achievementTypes.type, 'REGISTER'))
      .limit(1);

    const [existingAchievement] = await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));

    if (!existingAchievement) {
      await this.addUserAchievement(userId, registerAchievement.id);
    }
  }

  public static async processOnJournalAdded(userId: number): Promise<void> {
    const journalAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievementTypes.type, 'JOURNAL_COUNT'));

    const journalsCount = await JournalsService.getJournalsCount(userId);

    journalAchievements.forEach(async achievement => {
      if (journalsCount >= achievement.criteria) {
        await this.addUserAchievement(userId, achievement.id);
      }
    });
  }

  public static async processOnStreakUpdated(userId: number): Promise<void> {
    const streakAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievementTypes.type, 'JOURNAL_STREAK'));

    const currentStreak = await GameService.getCurrentStreak(userId);

    streakAchievements.forEach(async achievement => {
      if (currentStreak.streakLength >= achievement.criteria) {
        await this.addUserAchievement(userId, achievement.id);
      }
    });
  }

  public static async processOnLevelUpdated(userId: number): Promise<void> {
    const levelAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievementTypes.type, 'LEVEL'));

    const currentLevel = await GameService.getCurrentLevel(userId);

    levelAchievements.forEach(async achievement => {
      if (currentLevel.currentLevel >= achievement.criteria) {
        await this.addUserAchievement(userId, achievement.id);
      }
    });
  }

  public static async processOnJournalAnalyzed(userId: number): Promise<void> {}
}
