import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  timestamp,
  text,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { journalTags } from './tags.schema';
import { emotionAnalysis } from './emotions.schema';

export const journalStatusEnums = pgEnum('journal_status', [
  'DRAFT',
  'PUBLISHED',
  'ANALYZED',
]);

export const journals = pgTable('journals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  title: varchar('title').notNull(),
  content: varchar('content').notNull(),
  datetime: timestamp('datetime', { mode: 'date' }).notNull().defaultNow(),
  starred: boolean('starred').notNull().default(false),
  deleted: boolean('deleted').notNull().default(false),
  status: journalStatusEnums('status').notNull().default('DRAFT'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const journalFeedbacks = pgTable('journal_feedbacks', {
  id: serial('id').primaryKey(),
  journalId: integer('journal_id')
    .notNull()
    .references(() => journals.id)
    .unique(),
  feedback: text('feedback').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const journalsRelations = relations(journals, ({ one, many }) => ({
  user: one(users, {
    fields: [journals.userId],
    references: [users.id],
  }),
  tags: many(journalTags),
  emotionAnalysis: many(emotionAnalysis),
  feedback: one(journalFeedbacks, {
    fields: [journals.id],
    references: [journalFeedbacks.journalId],
  }),
}));

export const journalFeedbacksRelations = relations(
  journalFeedbacks,
  ({ one }) => ({
    journal: one(journals, {
      fields: [journalFeedbacks.journalId],
      references: [journals.id],
    }),
  }),
);
