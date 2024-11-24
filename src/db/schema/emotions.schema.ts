import {
  pgTable,
  serial,
  integer,
  numeric,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { journals } from './journals.schema';

export const emotions = pgTable('emotions', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
});

export const emotionAnalysis = pgTable('emotion_analysis', {
  id: serial('id').primaryKey(),
  journalId: integer('journal_id')
    .notNull()
    .references(() => journals.id),
  emotionId: integer('emotion_id')
    .notNull()
    .references(() => emotions.id),
  confidence: numeric('confidence').notNull(),
  analyzedAt: timestamp('analyzed_at').notNull(),
});

export const emotionsRelations = relations(emotions, ({ many }) => ({
  emotionAnalysis: many(emotionAnalysis),
}));

export const emotionAnalysisRelations = relations(
  emotionAnalysis,
  ({ one }) => ({
    journal: one(journals, {
      fields: [emotionAnalysis.journalId],
      references: [journals.id],
    }),
    emotion: one(emotions, {
      fields: [emotionAnalysis.emotionId],
      references: [emotions.id],
    }),
  }),
);
