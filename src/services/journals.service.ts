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
import Logger from '../utils/logger';

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
    };
  }

  public static async findJournals(
    userId: number,
    query?: QueryJournal,
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

    if (query?.id) addCondition(eq(journals.id, query?.id as number));

    if (query?.search) {
      addCondition(
        or(
          ilike(journals.title, `%${query?.search}%`),
          ilike(journals.content, `%${query?.search}%`),
        ),
      );
    }

    let dateCondition: SQL | undefined;
    if (query?.datetime) {
      dateCondition = eq(journals.datetime, query?.datetime as Date);
    } else if (query?.startDate && query?.endDate) {
      dateCondition = between(
        journals.datetime,
        query?.startDate as Date,
        query?.endDate as Date,
      );
    } else if (query?.startDate) {
      dateCondition = gte(journals.datetime, query?.startDate as Date);
    } else if (query?.endDate) {
      dateCondition = lte(journals.datetime, query?.endDate as Date);
    }
    addCondition(dateCondition);

    let tagCondition: SQL | undefined;
    if (query?.tags && query?.tags.length > 0) {
      const searchTags = query?.tags as number[];
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
    if (query?.emotions && query?.emotions.length > 0) {
      const searchEmotions = query?.emotions as string[];
      const emotionSubquery = db
        .select({ journalId: emotionAnalysis.journalId })
        .from(emotionAnalysis)
        .where(inArray(emotionAnalysis.emotion, searchEmotions))
        .groupBy(emotionAnalysis.journalId)
        .having(eq(count(emotionAnalysis.emotion), searchEmotions.length));

      emotionCondition = inArray(journals.id, emotionSubquery);
    }
    addCondition(emotionCondition);

    const raw = await db.query!.journals.findMany({
      where: and(...conditions),
      orderBy: [desc(journals.datetime), desc(journals.id)],
      limit: query?.limit as number,
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
      tags: journal.tags.map(tag => tag.tag.name),
    }));

    return allJournals;
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

    return journal;
  }

  public static async updateJournalById(
    userId: number,
    journalId: number,
    journal: UpdateJournal,
  ): Promise<Journal> {
    const existingJournal = await this.findJournalById(userId, journalId);

    const { tags: tagNames, ...journalData } = journal;
    Logger.debug(journalData);

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

      await db
        .delete(journalTags)
        .where(
          and(
            eq(journalTags.journalId, journalId),
            eq(journalTags.userId, userId),
          ),
        );

      await db.insert(journalTags).values(
        tagIds.map((tagId: number) => ({
          userId,
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

    return this.findJournalById(userId, journalId);
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
  ): Promise<string[]> {
    const raw = await db.query?.journalTags.findMany({
      where: and(eq(journalTags.journalId, journalId), eq(tags.userId, userId)),
      with: {
        tag: true,
      },
      columns: {
        userId: false,
        journalId: false,
        tagId: false,
      },
    });

    if (!raw) {
      throw new AppError('JOURNAL_NOT_FOUND', 404, 'Journal not found');
    }

    const allJournalTags = raw.map(journalTag => journalTag.tag.name);

    return allJournalTags;
  }

  public static async toggleJournalTag(
    userId: number,
    journalId: number,
    tagId: number,
  ): Promise<Tag> {
    const journal = await db.query?.journals.findFirst({
      where: and(eq(journals.id, journalId), eq(journals.userId, userId)),
    });

    if (!journal) {
      throw new AppError('JOURNAL_NOT_FOUND', 404, 'Journal not found');
    }

    const tag = await db.query?.tags.findFirst({
      where: eq(tags.id, tagId),
    });

    if (!tag) {
      throw new AppError('TAG_NOT_FOUND', 404, 'Tag not found');
    }

    const existingJournalTag = await db.query?.journalTags.findFirst({
      where: and(
        eq(journalTags.journalId, journalId),
        eq(journalTags.tagId, tagId),
      ),
    });

    let newJournalTag: Tag;

    if (existingJournalTag) {
      newJournalTag = await db
        .delete(journalTags)
        .where(
          and(
            eq(journalTags.journalId, journalId),
            eq(journalTags.tagId, tagId),
          ),
        )
        .returning()[0];
    } else {
      newJournalTag = await db
        .insert(journalTags)
        .values({ journalId, tagId, userId })
        .returning()[0];
    }

    return newJournalTag;
  }

  public static async addJournalFeedback(
    journalId: number,
    journalFeedback: AddJournalFeedback,
  ): Promise<JournalFeedback> {
    const [newJournalFeedback] = await db
      .insert(journalFeedbacks)
      .values({ journalId, ...journalFeedback })
      .returning();

    return newJournalFeedback;
  }

  public static async getJournalsCount(userId: number): Promise<number> {
    const [{ journalsCount }] = await db
      .select({ journalsCount: sql`count(*)` })
      .from(journals)
      .where(eq(journals.userId, userId));

    return Number(journalsCount as string);
  }
}
