import { NextFunction, Request, Response } from 'express';
import {
  AddJournalSchema,
  Journal,
  QueryJournalSchema,
} from '../types/journals.types';
import JournalsService from '../services/journals.service';
import { DefaultResponse } from '../types/response.types';
import { User } from '../types/users.types';

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

      const response: DefaultResponse<Journal | any> = {
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

      const response: DefaultResponse<Journal[] | any> = {
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

      const response: DefaultResponse<Journal | any> = {
        status: 'success',
        data: journal,
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

      res.status(204);
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

      res.status(204);
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

      const response: DefaultResponse<Journal | any> = {
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
      const tagId = Number(req.params.tagId);

      const journalTags = await JournalsService.toggleJournalTag(
        userId,
        journalId,
        tagId,
      );

      const response: DefaultResponse<Journal | any> = {
        status: 'success',
        data: journalTags,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
