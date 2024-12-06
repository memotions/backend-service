import { Request, Response, NextFunction } from 'express';
import { PubSubEvent, PubSubEventSchema } from '../types/pubsubs.types';
import { DefaultSuccessResponse } from '../types/response.types';
import EmotionsService from '../services/emotions.service';
import JournalsService from '../services/journals.service';
import AchievementsService from '../services/achievements.service';
import Logger from '../utils/logger';

export default class PubSubController {
  public static async processJournalEvent(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const eventMessage = PubSubEventSchema.parse(req.body);

      await EmotionsService.addEmotionAnalysis(
        eventMessage.journalId,
        eventMessage.emotionAnalysis.map(entry => ({
          emotion: entry.emotion,
          confidence: entry.confidence,
          analyzedAt: new Date(eventMessage.analyzedAt),
        })),
      );

      await JournalsService.addJournalFeedback(eventMessage.journalId, {
        feedback: eventMessage.feedback,
        createdAt: new Date(eventMessage.createdAt),
      });

      AchievementsService.processOnJournalAnalyzed(eventMessage.userId)
        .then(() => {
          Logger.info('Journal analyzed achievements processed');
        })
        .catch(error => Logger.error(error));

      const response: DefaultSuccessResponse<PubSubEvent> = {
        status: 'success',
        data: eventMessage,
        errors: null,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}
