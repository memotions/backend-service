import { date, integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const streaks = pgTable('streaks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}));
