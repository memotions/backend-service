import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { journals } from '../db/schema/journals.schema';
import { tags } from '../db/schema/tags.schema';

const InsertJournalsSchema = createInsertSchema(journals);
const SelectJournalSchema = createSelectSchema(journals);

export const CreateJournalSchema = InsertJournalsSchema.extend({
  tagIds: z
    .array(z.number())
    .refine((tagIds) => new Set(tagIds).size === tagIds.length, {
      message: 'Tags must be unique',
    })
    .optional(),
}).omit({
  userId: true,
});

export type CreateJournal = z.infer<typeof CreateJournalSchema>;
