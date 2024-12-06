import { and, eq } from 'drizzle-orm';
import db from '../db';
import { tags } from '../db/schema/tags.schema';
import { Tag } from '../types/tags.types';
import AppError from '../utils/appError';

export default class TagsService {
  public static async addTag(userId: number, tag: string): Promise<Tag> {
    const formattedTag = tag
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, formattedTag));

    if (existingTag) {
      return existingTag;
    }

    const [newTag] = await db
      .insert(tags)
      .values({ userId, name: formattedTag })
      .returning();

    return newTag;
  }

  public static async findAllTags(userId: number): Promise<Tag[]> {
    const allTags = await db
      .select({ id: tags.id, name: tags.name })
      .from(tags)
      .where(eq(tags.userId, userId));

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

  public static async findTagByName(
    userId: number,
    tagName: string,
  ): Promise<Tag> {
    const [tag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.name, tagName)));

    if (!tag) {
      throw new AppError('TAG_NOT_FOUND', 404, 'Tag not found');
    }

    return tag;
  }

  public static async deleteTagById(
    userId: number,
    tagId: number,
  ): Promise<Tag> {
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
