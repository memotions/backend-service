import db from '../db';
import { journals } from '../db/schema/journals.schema';
import { journalTags } from '../db/schema/tags.schema';
import Logger from '../utils/logger';
import { CreateJournal } from '../validators/journals.validator';

export const createJournal = async (userId: number, journal: CreateJournal) => {
  try {
    const { tagIds, ...journalData } = journal;
    console.log(journal, userId);
    const [newJournal] = await db
      .insert(journals)
      .values({
        userId,
        ...journalData,
      })
      .returning();

    if (journal.tagIds) {
      await db.insert(journalTags).values(
        journal.tagIds.map((tag) => ({
          journalId: newJournal.id,
          tagId: tag,
        })),
      );
    }

    return newJournal;
  } catch (error) {
    Logger.error(error);
  }
};
