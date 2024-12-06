import { date, integer, pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const streakCategories = pgTable('streak_categories', {
  category: varchar('category').primaryKey(),
});

export const streaks = pgTable('streaks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  category: varchar('category')
    .notNull()
    .references(() => streakCategories.category),
  startDate: date('start_date', { mode: 'date' }).notNull(),
  endDate: date('end_date', { mode: 'date' }).notNull(),
});

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
  category: one(streakCategories, {
    fields: [streaks.category],
    references: [streakCategories.category],
  }),
}));
