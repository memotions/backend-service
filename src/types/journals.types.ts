import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { journalFeedbacks, journals } from '../db/schema/journals.schema';
import { TagSchema } from './tags.types';
import { EmotionAnalysisSchema } from './emotions.types';

const SelectJournalSchema = createSelectSchema(journals);
const InsertJournalSchema = createInsertSchema(journals);

export const JournalFeedbackSchema = createSelectSchema(journalFeedbacks).omit({
  id: true,
  journalId: true,
});

export const JournalSchema = SelectJournalSchema.extend({
  tags: TagSchema.omit({ userId: true }).array(),
  feedback: JournalFeedbackSchema,
  emotionAnalysis: z.array(EmotionAnalysisSchema),
}).omit({
  userId: true,
});

export const AddJournalSchema = InsertJournalSchema.extend({
  date: z.string().date().optional(),
  tagIds: z
    .array(z.number())
    .refine(tagIds => new Set(tagIds).size === tagIds.length, {
      message: 'Tags must be unique',
    })
    .optional(),
}).omit({
  userId: true,
});

export const QueryJournalSchema = z.object({
  id: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined))
    .refine(val => !val || !Number.isNaN(val)),

  emotions: z
    .string()
    .optional()
    .transform(val =>
      val
        ?.split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !Number.isNaN(id)),
    )
    .refine(val => !val || new Set(val).size === val.length, {
      message: 'Emotions must be unique',
    }),

  tags: z
    .string()
    .optional()
    .transform(val =>
      val
        ?.split(',')
        .map(id => parseInt(id.trim(), 10))
        .filter(id => !Number.isNaN(id)),
    )
    .refine(val => !val || new Set(val).size === val.length, {
      message: 'Tags must be unique',
    }),

  date: z
    .string()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),

  endDate: z
    .string()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),

  startDate: z
    .string()
    .optional()
    .transform(val => (val ? new Date(val) : undefined)),

  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : undefined))
    .refine(val => !val || !Number.isNaN(val)),

  title: z.string().optional(),

  search: z.string().optional(),

  starred: z
    .string()
    .optional()
    .transform(val => val?.toLowerCase() === 'true' || undefined),

  archived: z
    .string()
    .optional()
    .transform(val => val?.toLowerCase() === 'true' || undefined),
});

export type Journal = z.infer<typeof JournalSchema>;
export type AddJournal = z.infer<typeof AddJournalSchema>;
export type QueryJournal = z.infer<typeof QueryJournalSchema>;
