import { NextFunction, Request, Response } from 'express';
import {
  AddJournalSchema,
  Journal,
  QueryJournalSchema,
  UpdateJournalSchema,
} from '../types/journals.types';
import JournalsService from '../services/journals.service';
import { DefaultSuccessResponse } from '../types/response.types';
import { User } from '../types/users.types';
import { Tag } from '../types/tags.types';
import AchievementsService from '../services/achievements.service';
import Logger from '../utils/logger';
import PubSubHandler from '../utils/pubsub';
import GameService from '../services/game.service';

export default class JournalsController {
  public static async addJournal(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;
      const journal = AddJournalSchema.parse(req.body);

      const newJournal = await JournalsService.addJournal(userId, journal);

      GameService.updateStreak(userId, 'JOURNAL_STREAK').then(() => {
        Logger.info('Updated journal streak');
      });

      GameService.addPoints(userId, {
        points: 10,
        type: 'JOURNAL_ENTRY',
      }).then(() => {
        Logger.info('Added journal entry points');
      });

      if (newJournal.status === 'PUBLISHED') {
        const pubsub = new PubSubHandler();
        pubsub
          .publishEventToPubSub(userId, newJournal.id, newJournal.content)
          .then(() => {
            Logger.info('Published journal to pubsub');
          })
          .catch(error => Logger.error(error));

        AchievementsService.processOnJournalPublished(userId)
          .then(() => {
            Logger.info('Published journal achievements processed');
          })
          .catch(error => Logger.error(error));
      }

      const response: DefaultSuccessResponse<Journal> = {
        status: 'success',
        data: newJournal,
        errors: null,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async findJournals(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;
      const query = QueryJournalSchema.parse(req.query);

      const journals = await JournalsService.findJournals(userId, query);

      const response: DefaultSuccessResponse<Journal[]> = {
        status: 'success',
        data: journals,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async findJournalById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;
      const journalId = Number(req.params.journalId);

      const journal = await JournalsService.findJournalById(userId, journalId);

      const response: DefaultSuccessResponse<Journal> = {
        status: 'success',
        data: journal,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async updateJournalById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;
      const journalId = Number(req.params.journalId);
      const journal = UpdateJournalSchema.parse(req.body);

      const updatedJournal = await JournalsService.updateJournalById(
        userId,
        journalId,
        journal,
      );

      if (updatedJournal.status === 'PUBLISHED') {
        const pubsub = new PubSubHandler();
        pubsub
          .publishEventToPubSub(
            userId,
            updatedJournal.id,
            updatedJournal.content,
          )
          .then(() => {
            Logger.info('Published journal to pubsub');
          })
          .catch(error => Logger.error(error));

        AchievementsService.processOnJournalPublished(userId)
          .then(() => {
            Logger.info('Published journal achievements processed');
          })
          .catch(error => Logger.error(error));
      }

      const response: DefaultSuccessResponse<Journal> = {
        status: 'success',
        data: updatedJournal,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteJournalById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;
      const journalId = Number(req.params.journalId);

      await JournalsService.deleteJournalById(userId, journalId);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  public static async toggleStarJournal(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;
      const journalId = Number(req.params.journalId);

      await JournalsService.toggleStarJournal(userId, journalId);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }

  public static async findJournalTags(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;
      const journalId = Number(req.params.journalId);

      const journalTags = await JournalsService.findJournalTags(
        userId,
        journalId,
      );

      const response: DefaultSuccessResponse<Tag[]> = {
        status: 'success',
        data: journalTags,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async toggleJournalTag(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;
      const journalId = Number(req.params.journalId);
      const { tagName } = req.params;

      await JournalsService.toggleJournalTag(userId, journalId, tagName);

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}
