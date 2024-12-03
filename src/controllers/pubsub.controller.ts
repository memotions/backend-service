import { Request, Response, NextFunction } from 'express';
import { PubsubEvent, PubsubEventSchema } from '../types/pubsubs.types';
import { DefaultResponse } from '../types/response.types';
import PubSubService from '../services/pubsub.service';

export default class PubsubController {
  public static async hello(req, res) {
    res.status(200).json({ message: 'Hello from Pubsub!' });
  }

  public static async processJournalEvent(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // Validate input
      const eventMessage = PubsubEventSchema.parse(req.body);

      // Add Emotions
      await PubSubService.addEmotionAnalysis(
        eventMessage.journalId, 
        eventMessage.emotion,
        eventMessage.analyzedAt ? new Date(eventMessage.createdAt) : new(Date)
      );

      // Add Feedback
      await PubSubService.addJournalFeedback(
        eventMessage.journalId, 
        eventMessage.feedback,
        eventMessage.createdAt ? new Date(eventMessage.createdAt) : new(Date)
      );

      // Call Notification Service
      const response: DefaultResponse<PubsubEvent | any> = {
        status: 'success',
        data: eventMessage ,
        errors: null,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}