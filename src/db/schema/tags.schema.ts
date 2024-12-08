import {
  pgTable,
  serial,
  varchar,
  integer,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';
import { journals } from './journals.schema';

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
});

export const journalTags = pgTable(
  'journal_tags',
  {
    journalId: integer('journal_id')
      .notNull()
      .references(() => journals.id),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, {
        onDelete: 'cascade',
      }),
  },
  table => [primaryKey({ columns: [table.journalId, table.tagId] })],
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  journalTags: many(journalTags),
}));

export const journalTagsRelations = relations(journalTags, ({ one }) => ({
  journal: one(journals, {
    fields: [journalTags.journalId],
    references: [journals.id],
  }),
  tag: one(tags, {
    fields: [journalTags.tagId],
    references: [tags.id],
  }),
}));
