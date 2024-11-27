import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { tags } from '../db/schema/tags.schema';
import { ResponseSchema } from './response.types';

export const TagSchema = createSelectSchema(tags);
export const CreateTagSchema = createInsertSchema(tags).omit({
  userId: true,
});

export const TagResponseSchema = ResponseSchema(TagSchema);
export const TagsResponseSchema = ResponseSchema(TagSchema.array());

export type Tag = z.infer<typeof TagSchema>;
export type CreateTag = z.infer<typeof CreateTagSchema>;
export type TagResponse = z.infer<typeof TagResponseSchema>;
export type TagsResponse = z.infer<typeof TagsResponseSchema>;
