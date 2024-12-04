import { Request, Response, NextFunction } from 'express';
import { PubSubEvent, PubSubEventSchema } from '../types/pubsubs.types';
import { DefaultSuccessResponse } from '../types/response.types';
import EmotionsService from '../services/emotions.service';
import JournalsService from '../services/journals.service';

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
