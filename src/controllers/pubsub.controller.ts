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

export default class PubSubController {
  private static async processEmotionAnalysis(
    journalId: number,
    analyzedAt: string,
    emotionAnalysis: AddEmotionAnalysis[],
  ) {
    return EmotionAnalysisService.addEmotionAnalysis(
      journalId,
      emotionAnalysis.map(entry => ({
        emotion: entry.emotion,
        confidence: entry.confidence,
        analyzedAt: new Date(analyzedAt),
      })),
    );
  }

  private static async processFeedback(
    journalId: number,
    feedback: string,
    createdAt: string,
  ) {
    return JournalsService.addJournalFeedback(journalId, {
      feedback,
      createdAt: new Date(createdAt),
    });
  }

  private static async processJournalStatus(journalId: number) {
    return db
      .update(journals)
      .set({ status: 'ANALYZED' })
      .where(eq(journals.id, journalId));
  }

  private static async processAchievements(userId: number) {
    return AchievementsService.processOnJournalAnalyzed(userId)
      .then(() => {
        Logger.info(
          `Journal analyzed achievements processed for user ${userId}`,
        );
      })
      .catch(error => {
        Logger.error(`Achievement processing error for user ${userId}:`, error);
      });
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
        res.status(200).end();
        return;
      }

      if (check.status === 'PUBLISHED') {
        await Promise.all([
          this.processEmotionAnalysis(
            data.journalId,
            data.analyzedAt,
            data.emotionAnalysis,
          ).catch(error => Logger.error(error)),
          this.processFeedback(
            data.journalId,
            data.feedback,
            data.createdAt,
          ).catch(error => Logger.error(error)),
          this.processJournalStatus(data.journalId).catch(error =>
            Logger.error(error),
          ),
        ]);

        this.processAchievements(data.userId);
      }

      res.status(200).end();
    } catch (error) {
      Logger.error(`[Pub\\Sub] ${error}`);
      res.status(200).end();
    }
  }
}
