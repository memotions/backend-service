import {
  and,
  between,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  SQL,
} from 'drizzle-orm';
import db from '../db';
import { journals } from '../db/schema/journals.schema';
import { journalTags, tags } from '../db/schema/tags.schema';
import { AddJournal, Journal, QueryJournal } from '../types/journals.types';
import AppError from '../utils/appError';
import { emotionAnalysis } from '../db/schema/emotions.schema';

export default class JournalsService {
  public static async addJournal(
    userId: number,
    journal: AddJournal,
  ): Promise<Journal | any> {
    const { tagIds, date, ...journalData } = journal;

    const [newJournal] = await db
      .insert(journals)
      .values({
        userId,
        date: date ? new Date(date) : new Date(),
        ...journalData,
      })
      .returning();

    if (journal.tagIds) {
      const selectedTags = await db
        .select()
        .from(tags)
        .where(inArray(tags.id, journal.tagIds));

      if (selectedTags.length !== journal.tagIds.length) {
        throw new AppError('TAG_NOT_FOUND', 404, 'Tag not found');
      }

      await db.insert(journalTags).values(
        journal.tagIds.map((tagId: number) => ({
          journalId: newJournal.id,
          tagId,
        })),
      );
    }

    return newJournal;
  }

  public static async findJournals(
    userId: number,
    query: QueryJournal,
  ): Promise<Journal[]> {
    const conditions: SQL[] = [eq(journals.userId, userId)];

    const addCondition = (condition?: SQL) => {
      if (condition) {
        conditions.push(condition);
      }
    };

    if (query.id) addCondition(eq(journals.id, query.id as number));

    if (query.search) {
      addCondition(
        or(
          ilike(journals.title, `%${query.search}%`),
          ilike(journals.content, `%${query.search}%`),
        ),
      );
    }

    let dateCondition: SQL | undefined;
    if (query.date) {
      dateCondition = eq(journals.date, query.date as Date);
    } else if (query.startDate && query.endDate) {
      dateCondition = between(
        journals.date,
        query.startDate as Date,
        query.endDate as Date,
      );
    } else if (query.startDate) {
      dateCondition = gte(journals.date, query.startDate as Date);
    } else if (query.endDate) {
      dateCondition = lte(journals.date, query.endDate as Date);
    }
    addCondition(dateCondition);

    let tagCondition: SQL | undefined;
    if (query.tags && query.tags.length > 0) {
      const searchTags = query.tags as number[];
      const tagSubquery = db
        .select({ journalId: journalTags.journalId })
        .from(journalTags)
        .where(inArray(journalTags.tagId, searchTags))
        .groupBy(journalTags.journalId)
        .having(eq(count(journalTags.tagId), searchTags.length));

      tagCondition = inArray(journals.id, tagSubquery);
    }
    addCondition(tagCondition);

    let emotionCondition: SQL | undefined;
    if (query.emotions && query.emotions.length > 0) {
      const searchEmotions = query.emotions as number[];
      const emotionSubquery = db
        .select({ journalId: emotionAnalysis.journalId })
        .from(emotionAnalysis)
        .where(inArray(emotionAnalysis.emotionId, searchEmotions))
        .groupBy(emotionAnalysis.journalId)
        .having(eq(count(emotionAnalysis.emotionId), searchEmotions.length));

      emotionCondition = inArray(journals.id, emotionSubquery);
    }
    addCondition(emotionCondition);

    const raw = await db.query.journals.findMany({
      where: conditions.length > 1 ? and(...conditions) : undefined,
      orderBy: [desc(journals.date)],
      limit: query.limit as number,
      columns: {
        userId: false,
      },
      with: {
        tags: {
          columns: {
            journalId: false,
            tagId: false,
          },
          with: {
            tag: true,
          },
        },
        emotionAnalysis: {
          columns: {
            emotionId: false,
            journalId: false,
          },
          with: {
            emotion: true,
          },
        },
        feedback: {
          columns: {
            id: false,
            journalId: false,
          },
        },
      },
    });

    const allJournals: Journal[] = raw.map(journal => ({
      ...journal,
      tags: journal.tags.map(tag => ({
        id: tag.tag.id,
        name: tag.tag.name,
      })),
    }));

    return allJournals;
  }

  public static async findJournalById(userId: number, journalId: number) {
    const [journal] = await this.findJournals(userId, {
      id: journalId,
      limit: 1,
    });

    if (!journal) {
      throw new AppError('JOURNAL_NOT_FOUND', 404, 'Journal not found');
    }

    return journal;
  }

  public static async deleteJournalById(userId: number, journalId: number) {
    const [deletedJournal] = await db
      .delete(journals)
      .where(eq(journals.id, journalId))
      .returning();

    if (!deletedJournal) {
      throw new AppError('JOURNAL_NOT_FOUND', 404, 'Journal not found');
    }

    return deletedJournal;
  }

  public static async addJournalTags(
    userId: number,
    journalId: number,
    tagIds: number[],
  ) {
    await db.insert(journalTags).values(
      tagIds.map((tagId: number) => ({
        journalId,
        tagId,
      })),
    );
  }

  public static async findJournalTags(userId: number, journalId: number) {
    const allJournalTags = await db
      .select()
      .from(journalTags)
      .where(
        and(eq(journalTags.journalId, journalId), eq(tags.userId, userId)),
      );

    return allJournalTags;
  }

  public static async deleteJournalTagById(
    userId: number,
    journalId: number,
    tagId: number,
  ) {
    const [deletedJournalTags] = await db
      .delete(journalTags)
      .where(
        and(
          and(
            eq(journalTags.journalId, journalId),
            eq(journalTags.tagId, tagId),
          ),
          eq(tags.userId, userId),
        ),
      )
      .returning();

    return deletedJournalTags;
  }
}