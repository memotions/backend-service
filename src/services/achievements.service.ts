import { eq, inArray } from 'drizzle-orm';
import db from '../db';
import {
  achievements,
  achievementTypes,
  userAchievements,
} from '../db/schema/achievements.schema';
import JournalsService from './journals.service';
import GameService from './game.service';
import EmotionsService from './emotions.service';

export default class AchievementsService {
  private static async addUserAchievement(
    userId: number,
    achievementId: number,
    pointsAwarded: number,
  ) {
    await db.insert(userAchievements).values({ userId, achievementId });

    await GameService.addPoints(userId, {
      points: pointsAwarded,
      type: 'ACHIEVEMENT_BONUS',
    });
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
      await this.addUserAchievement(
        userId,
        registerAchievement.id,
        registerAchievement.pointsAwarded,
      );
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
        await this.addUserAchievement(
          userId,
          achievement.id,
          achievement.pointsAwarded,
        );
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
        await this.addUserAchievement(
          userId,
          achievement.id,
          achievement.pointsAwarded,
        );
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
        await this.addUserAchievement(
          userId,
          achievement.id,
          achievement.pointsAwarded,
        );
      }
    });
  }

  public static async processOnJournalAnalyzed(userId: number): Promise<void> {
    const emotionsAchievements = await db
      .select()
      .from(achievements)
      .where(
        inArray(achievementTypes.type, [
          'POSITIVE_COUNT',
          'RISE_COUNT',
          'POSITIVE_STREAK',
        ]),
      );

    const emotionAnalyzed = await EmotionsService.getEmotionAnalysis(userId);

    const positiveCount = emotionAnalyzed.filter(
      e => e.emotion === 'HAPPY',
    ).length;

    const riseCount = emotionAnalyzed.reduce((count, current, index) => {
      if (index === 0) return count;

      const prevEmotion = emotionAnalyzed[index - 1];

      const isNegativeEmotions = ['SAD', 'ANGRY', 'SCARED'];
      const isPositiveEmotions = ['HAPPY'];

      const transitionCondition =
        prevEmotion.journalId !== current.journalId &&
        isNegativeEmotions.includes(prevEmotion.emotion) &&
        isPositiveEmotions.includes(current.emotion);

      return transitionCondition ? count + 1 : count;
    }, 0);

    let positiveStreak = 0;
    let currentStreak = 0;
    let lastJournalId = 0;

    emotionAnalyzed.forEach(e => {
      if (lastJournalId !== e.journalId) {
        if (e.emotion !== 'HAPPY') {
          currentStreak = 0;
        }
        lastJournalId = e.journalId;
      }

      if (e.emotion === 'HAPPY') {
        currentStreak += 1;
        positiveStreak = Math.max(positiveStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    emotionsAchievements.forEach(async achievement => {
      let achieved = false;

      switch (achievement.type) {
        case 'POSITIVE_COUNT':
          achieved = positiveCount >= achievement.criteria;
          break;
        case 'RISE_COUNT':
          achieved = riseCount >= achievement.criteria;
          break;
        case 'POSITIVE_STREAK':
          achieved = positiveStreak >= achievement.criteria;
          break;
        default:
          break;
      }

      if (achieved) {
        await this.addUserAchievement(
          userId,
          achievement.id,
          achievement.pointsAwarded,
        );
      }
    });
  }
}
