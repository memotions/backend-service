import { eq } from 'drizzle-orm';
import db from '../db';
import { emotionAnalysis, emotionClasses } from '../db/schema/emotions.schema';
import { journalFeedbacks, journals } from '../db/schema/journals.schema';
import AppError from '../utils/appError';
import Logger from '../utils/logger';

export default class PubSubService {
  // public static async add emotions


  
   public static async addJournalFeedback(
    journalId: number,
    feedback: string,
    createdAt: Date
  ): Promise<void> {
    try {
      const existingJournal = await db
        .select()
        .from(journals)
        .where(eq(journals.id, journalId));

      if (!existingJournal.length) {
        throw new AppError('JOURNAL_NOT_FOUND', 404, 'Journal not found');
      }

      Logger.info(`Existing Journal: ${JSON.stringify(existingJournal, null, 2)}`);

      await db.insert(journalFeedbacks).values({
        journalId,
        feedback,
        createdAt,
      });

      Logger.info(`Feedback successfully added for Journal ID: ${journalId}`);
    } catch (error) {
      if (error instanceof AppError) {
        Logger.error(`AppError: ${error.message}`);
        throw error;
      } else {
        Logger.error(`Unexpected Error: ${error}`);
        throw new AppError('UNKNOWN_ERROR', 500, 'An unexpected error occurred');
      }
    }
  }
}
