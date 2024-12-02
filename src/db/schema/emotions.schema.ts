import {
  pgTable,
  serial,
  integer,
  timestamp,
  varchar,
  decimal,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { journals } from './journals.schema';

export const emotions = pgTable('emotions', {
  emotion: varchar('emotion').primaryKey(),
});

export const emotionAnalysis = pgTable('emotion_analysis', {
  id: serial('id').primaryKey(),
  journalId: integer('journal_id')
    .notNull()
    .references(() => journals.id),
  emotion: varchar('emotion')
    .notNull()
    .references(() => emotions.emotion),
  confidence: decimal('confidence').notNull(),
  analyzedAt: timestamp('analyzed_at').notNull().defaultNow(),
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
      fields: [emotionAnalysis.emotion],
      references: [emotions.emotion],
    }),
  }),
);
