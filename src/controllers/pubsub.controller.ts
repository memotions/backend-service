import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { DataEventSchema, RawEventSchema } from '../types/pubsubs.types';
import EmotionAnalysisService from '../services/emotionsAnalysis.service';
import JournalsService from '../services/journals.service';
import AchievementsService from '../services/achievements.service';
import Logger from '../utils/logger';
import db from '../db';
import { journals } from '../db/schema/journals.schema';

export default class PubSubController {
  public static async processOnJournalPublished(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
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

      await EmotionAnalysisService.addEmotionAnalysis(
        data.journalId,
        data.emotionAnalysis.map(entry => ({
          emotion: entry.emotion,
          confidence: entry.confidence,
          analyzedAt: new Date(data.analyzedAt),
        })),
      );

      await JournalsService.addJournalFeedback(data.journalId, {
        feedback: data.feedback,
        createdAt: new Date(data.createdAt),
      });

      await db
        .update(journals)
        .set({ status: 'ANALYZED' })
        .where(eq(journals.id, data.journalId));

      AchievementsService.processOnJournalAnalyzed(data.userId)
        .then(() => {
          Logger.info('Journal analyzed achievements processed');
        })
        .catch(error => Logger.error(error));

      res.status(200).end();
    } catch (error) {
      next(error);
    }
  }
}
