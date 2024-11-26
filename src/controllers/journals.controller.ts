import { Request, Response } from 'express';
import { CreateJournalSchema } from '../validators/journals.validator';
import { createJournal } from '../services/journals.service';
import { handleZodError } from '../utils/handleZodError';
import { z } from 'zod';
import Logger from '../utils/logger';
import ApiError from '../utils/apiError';

export const createJournalController = async (req: Request, res: Response) => {
  try {
    const { id } = req.user as { id: number };
    const journal = CreateJournalSchema.parse(req.body);

    const newJournal = await createJournal(id, journal);

    res.status(201).json(newJournal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = handleZodError(error);

      Logger.error(errors);
    } else if (error instanceof ApiError) {
      Logger.error(error.message);
    } else {
      Logger.error(error);
    }
  }
};

export const getJournalsController = async (req: Request, res: Response) => {};

export const getJournalByIdController = async (
  req: Request,
  res: Response,
) => {};
