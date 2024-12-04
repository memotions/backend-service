import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { tags } from '../db/schema/tags.schema';

export const TagSchema = createSelectSchema(tags).omit({
  userId: true,
});

export const AddTagSchema = createInsertSchema(tags).omit({
  userId: true,
});

export type Tag = z.infer<typeof TagSchema>;
export type AddTag = z.infer<typeof AddTagSchema>;
