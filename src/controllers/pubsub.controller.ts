import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { DataEventSchema, RawEventSchema } from '../types/pubsubs.types';
import EmotionAnalysisService from '../services/emotionsAnalysis.service';
import JournalsService from '../services/journals.service';
import AchievementsService from '../services/achievements.service';
import Logger from '../utils/logger';
import db from '../db';
import { journals } from '../db/schema/journals.schema';
import { AddEmotionAnalysis } from '../types/emotions.types';
import GameService from '../services/game.service';

export default class PubSubController {
  private static async processEmotionAnalysis(
    userId: number,
    journalId: number,
    analyzedAt: string,
    emotionAnalysis: AddEmotionAnalysis[],
  ) {
    if (
      emotionAnalysis.filter(
        entry => entry.emotion === 'HAPPY' && entry.confidence > 0.5,
      ).length > 0
    ) {
      await GameService.updateStreak(userId, 'POSITIVE_STREAK');
    }

    return EmotionAnalysisService.addEmotionAnalysis(
      journalId,
      emotionAnalysis.map(entry => ({
        emotion: entry.emotion,
        confidence: entry.confidence,
        analyzedAt: new Date(analyzedAt),
      })),
    )
      .then(() => {
        Logger.info(`Emotion analysis processed for journal ${journalId}`);
      })
      .catch(error => Logger.error(error));
  }

  private static async processFeedback(
    journalId: number,
    feedback: string,
    createdAt: string,
  ) {
    return JournalsService.addJournalFeedback(journalId, {
      feedback,
      createdAt: new Date(createdAt),
    })
      .then(() => {
        Logger.info(`Journal feedback processed for journal ${journalId}`);
      })
      .catch(error => Logger.error(error));
  }

  private static async processJournalStatus(journalId: number) {
    return db
      .update(journals)
      .set({ status: 'ANALYZED' })
      .where(eq(journals.id, journalId))
      .then(() => {
        Logger.info(`Journal status processed for journal ${journalId}`);
      })
      .catch(error => Logger.error(error));
  }

  private static async processAchievements(userId: number) {
    return AchievementsService.processOnJournalAnalyzed(userId)
      .then(() => {
        Logger.info(`Achievements processed for user ${userId}`);
      })
      .catch(error => Logger.error(error));
  }

  public static async processOnJournalPublished(req: Request, res: Response) {
    try {
      const raw = RawEventSchema.parse(req.body);
      const data = DataEventSchema.parse(raw.message.data);

      const check = await JournalsService.findJournalById(
        data.userId,
        data.journalId,
      );

      if (check.status === 'ANALYZED') {
        Logger.info(`Journal ${data.journalId} already analyzed`);
        res.status(200).end();
        return;
      }
      PubSubController.processEmotionAnalysis(
        data.userId,
        data.journalId,
        data.analyzedAt,
        data.emotionAnalysis,
      );
      PubSubController.processFeedback(
        data.journalId,
        data.feedback,
        data.createdAt,
      );
      PubSubController.processJournalStatus(data.journalId);
      PubSubController.processAchievements(data.userId);

      res.status(200).end();
    } catch (error) {
      Logger.error(`[Pub/Sub] ${error}`);
      res.status(200).end();
    }
  }
}
