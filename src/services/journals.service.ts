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
  not,
  or,
  sql,
  SQL,
} from 'drizzle-orm';
import db from '../db';
import { journalFeedbacks, journals } from '../db/schema/journals.schema';
import { journalTags, tags } from '../db/schema/tags.schema';
import {
  AddJournal,
  AddJournalFeedback,
  Journal,
  JournalFeedback,
  QueryJournal,
  UpdateJournal,
} from '../types/journals.types';
import AppError from '../utils/appError';
import { emotionAnalysis } from '../db/schema/emotions.schema';
import { Tag } from '../types/tags.types';
import TagsService from './tags.service';

export default class JournalsService {
  public static async addJournal(
    userId: number,
    journal: AddJournal,
  ): Promise<Journal> {
    const { tags: tagNames, ...journalData } = journal;

    const tagIds: number[] = [];
    if (tagNames) {
      const tagPromises = tagNames.map(async tagName => {
        let tag: Tag;
        try {
          tag = await TagsService.findTagByName(userId, tagName);
        } catch (error) {
          tag = await TagsService.addTag(userId, tagName);
        }
        return tag.id;
      });

      const resolvedTagIds = await Promise.all(tagPromises);
      tagIds.push(...resolvedTagIds);
    }

    const [newJournal] = await db
      .insert(journals)
      .values({
        userId,
        ...journalData,
      })
      .returning();

    if (tagIds.length > 0) {
      await db.insert(journalTags).values(
        tagIds.map((tagId: number) => ({
          userId,
          journalId: newJournal.id,
          tagId,
        })),
      );
    }

    const newJournalTags = await db
      .select()
      .from(tags)
      .where(inArray(tags.id, tagIds));

    return {
      ...newJournal,
      tags: newJournalTags.map(tag => tag.name),
      emotionAnalysis: [],
      feedback: null,
    } as Journal;
  }

  public static async findJournals(
    userId: number,
    queryParams?: QueryJournal,
  ): Promise<Journal[]> {
    const conditions: SQL[] = [
      eq(journals.userId, userId),
      eq(journals.deleted, false),
    ];

    const addCondition = (condition?: SQL) => {
      if (condition) {
        conditions.push(condition);
      }
    };

    if (queryParams?.id)
      addCondition(eq(journals.id, queryParams?.id as number));

    if (queryParams?.search) {
      addCondition(
        or(
          ilike(journals.title, `%${queryParams?.search}%`),
          ilike(journals.content, `%${queryParams?.search}%`),
        ),
      );
    }

    let dateCondition: SQL | undefined;
    if (queryParams?.datetime) {
      dateCondition = eq(journals.datetime, queryParams?.datetime as Date);
    } else if (queryParams?.startDate && queryParams?.endDate) {
      dateCondition = between(
        journals.datetime,
        queryParams?.startDate as Date,
        queryParams?.endDate as Date,
      );
    } else if (queryParams?.startDate) {
      dateCondition = gte(journals.datetime, queryParams?.startDate as Date);
    } else if (queryParams?.endDate) {
      dateCondition = lte(journals.datetime, queryParams?.endDate as Date);
    }
    addCondition(dateCondition);

    let tagCondition: SQL | undefined;
    if (queryParams?.tags && queryParams?.tags.length > 0) {
      const searchTags = queryParams?.tags as number[];
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
    if (queryParams?.emotions && queryParams?.emotions.length > 0) {
      const searchEmotions = queryParams?.emotions as string[];
      const emotionSubquery = db
        .select({ journalId: emotionAnalysis.journalId })
        .from(emotionAnalysis)
        .where(inArray(emotionAnalysis.emotion, searchEmotions))
        .groupBy(emotionAnalysis.journalId)
        .having(eq(count(emotionAnalysis.emotion), searchEmotions.length));

      emotionCondition = inArray(journals.id, emotionSubquery);
    }
    addCondition(emotionCondition);

    const raw = await db.query.journals.findMany({
      where: and(...conditions),
      orderBy: [desc(journals.datetime), desc(journals.id)],
      limit: queryParams?.limit as number,
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
            journalId: false,
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
      tags: journal.tags.map(tag => tag.tag.name),
      emotionAnalysis: journal.emotionAnalysis
        .map(e => ({
          emotion: e.emotion,
          confidence: e.confidence,
        }))
        .sort((a, b) => b.confidence - a.confidence),
      feedback: journal.feedback ? journal.feedback.feedback : null,
    }));

    return allJournals as Journal[];
  }

  public static async findJournalById(
    userId: number,
    journalId: number,
  ): Promise<Journal> {
    const [journal] = await this.findJournals(userId, {
      id: journalId,
      limit: 1,
    });

    if (!journal) {
      throw new AppError('JOURNAL_NOT_FOUND', 404, 'Journal not found');
    }

    return journal as Journal;
  }

  public static async updateJournalById(
    userId: number,
    journalId: number,
    journal: UpdateJournal,
  ): Promise<Journal> {
    const existingJournal = await this.findJournalById(userId, journalId);

    const { tags: tagNames, ...journalData } = journal;

    if (tagNames && tagNames.length === 0) {
      await db.delete(journalTags).where(eq(journalTags.journalId, journalId));
    }

    const tagIds: number[] = [];
    if (tagNames && tagNames.length > 0) {
      const tagPromises = tagNames.map(async tagName => {
        let tag: Tag;
        try {
          tag = await TagsService.findTagByName(userId, tagName);
        } catch (error) {
          tag = await TagsService.addTag(userId, tagName);
        }
        return tag.id;
      });

      const resolvedTagIds = await Promise.all(tagPromises);
      tagIds.push(...resolvedTagIds);

      await db.delete(journalTags).where(eq(journalTags.journalId, journalId));

      await db.insert(journalTags).values(
        tagIds.map((tagId: number) => ({
          journalId,
          tagId,
        })),
      );
    }

    if (existingJournal.status !== 'DRAFT') {
      throw new AppError(
        'INVALID_JOURNAL_STATUS',
        400,
        'Journal status is not draft',
      );
    }

    if (journalData && Object.keys(journalData).length > 0) {
      await db
        .update(journals)
        .set(journalData)
        .where(and(eq(journals.userId, userId), eq(journals.id, journalId)));
    } else {
      throw new AppError('INVALID_JOURNAL_DATA', 400, 'Invalid journal data');
    }

    const updatedJournal = await this.findJournalById(userId, journalId);
    return updatedJournal as Journal;
  }

  public static async deleteJournalById(
    userId: number,
    journalId: number,
  ): Promise<void> {
    const [{ deleted }] = await db
      .select()
      .from(journals)
      .where(and(eq(journals.userId, userId), eq(journals.id, journalId)));

    if (deleted) {
      throw new AppError('JOURNAL_NOT_FOUND', 404, 'Journal not found');
    }

    await db
      .update(journals)
      .set({ deleted: true })
      .where(and(eq(journals.userId, userId), eq(journals.id, journalId)));
  }

  public static async toggleStarJournal(
    userId: number,
    journalId: number,
  ): Promise<void> {
    const [starredJournal] = await db
      .update(journals)
      .set({ starred: not(journals.starred) })
      .where(and(eq(journals.userId, userId), eq(journals.id, journalId)))
      .returning();

    if (!starredJournal) {
      throw new AppError('JOURNAL_NOT_FOUND', 404, 'Journal not found');
    }
  }

  public static async findJournalTags(
    userId: number,
    journalId: number,
  ): Promise<Tag[]> {
    const allJournalTags = await db.query.journalTags.findMany({
      where: eq(journalTags.journalId, journalId),
      with: {
        tag: {
          columns: {
            id: true,
            name: true,
            userId: true,
          },
        },
      },
      columns: {
        journalId: false,
        tagId: false,
      },
    });

    if (!allJournalTags) {
      throw new AppError('JOURNAL_NOT_FOUND', 404, 'Journal not found');
    }

    return allJournalTags
      .filter(tag => tag.tag.userId === userId)
      .map(tag => ({
        id: tag.tag.id,
        name: tag.tag.name,
      })) as Tag[];
  }

  public static async toggleJournalTag(
    userId: number,
    journalId: number,
    tagName: string,
  ): Promise<void> {
    const existingJournalTags = await this.findJournalTags(userId, journalId);
    const userTag = existingJournalTags.find(tag => tag.name === tagName);

    if (userTag) {
      await db
        .delete(journalTags)
        .where(
          and(
            eq(journalTags.journalId, journalId),
            eq(journalTags.tagId, userTag.id),
          ),
        );
    } else {
      const existingTag = await TagsService.findTagByName(userId, tagName);

      if (!existingTag) {
        throw new AppError('TAG_NOT_FOUND', 404, 'Tag not found');
      }

      await db.insert(journalTags).values({
        journalId,
        tagId: existingTag.id,
      });
    }
  }

  public static async addJournalFeedback(
    journalId: number,
    journalFeedback: AddJournalFeedback,
  ): Promise<JournalFeedback> {
    const [newJournalFeedback] = await db
      .insert(journalFeedbacks)
      .values({ journalId, ...journalFeedback })
      .returning();

    return newJournalFeedback as JournalFeedback;
  }

  public static async getJournalsCount(userId: number): Promise<number> {
    const [{ journalsCount }] = await db
      .select({ journalsCount: sql`count(*)` })
      .from(journals)
      .where(eq(journals.userId, userId));

    return Number(journalsCount as string);
  }
}
