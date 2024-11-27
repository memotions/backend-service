import { and, eq } from 'drizzle-orm';
import db from '../db';
import { tags } from '../db/schema/tags.schema';
import { CreateTag, Tag } from '../types/tags.types';
import AppError from '../utils/appError';

export default class TagsService {
  public static async createTag(userId: number, tag: CreateTag): Promise<Tag> {
    const [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, tag.name));

    if (existingTag) {
      throw new AppError('TAG_ALREADY_EXISTS', 409, 'Tag already exists');
    }

    const [newTag] = await db
      .insert(tags)
      .values({ userId, ...tag })
      .returning();

    return newTag;
  }

  public static async findAllTags(userId: number): Promise<Tag[]> {
    const allTags = await db.select().from(tags).where(eq(tags.userId, userId));
    return allTags;
  }

  public static async findTagById(userId: number, tagId: number): Promise<Tag> {
    const [tag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.id, tagId)));

    if (!tag) {
      throw new AppError('TAG_NOT_FOUND', 404, 'Tag not found');
    }

    return tag;
  }

  public static async deleteTag(userId: number, tagId: number): Promise<Tag> {
    const [deletedTag] = await db
      .delete(tags)
      .where(and(eq(tags.userId, userId), eq(tags.id, tagId)))
      .returning();

    if (!deletedTag) {
      throw new AppError('TAG_NOT_FOUND', 404, 'Tag not found');
    }

    return deletedTag;
  }
}
