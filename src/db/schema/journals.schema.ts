import {
  pgTable,
  serial,
  integer,
  varchar,
  boolean,
  date,
  timestamp,
  text,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { journalTags } from './tags.schema';
import { emotionAnalysis } from './emotions.schema';

export const journals = pgTable('journals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  title: varchar('title').notNull(),
  content: varchar('content').notNull(),
  date: date('date').notNull(),
  starred: boolean('starred').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const journalFeedbacks = pgTable(
  'journal_feedbacks',
  {
    journalId: integer('journal_id')
      .notNull()
      .references(() => journals.id),
    feedback: text('feedback').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.journalId] })],
);

export const journalsRelations = relations(journals, ({ one, many }) => ({
  user: one(users, {
    fields: [journals.userId],
    references: [users.id],
  }),
  tags: many(journalTags),
  emotions: many(emotionAnalysis),
  feedbacks: one(journalFeedbacks),
}));
