import {
  pgTable,
  serial,
  integer,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const pointTransactionTypeEnums = pgEnum('transaction_type', [
  'JOURNAL_ENTRY',
  'STREAK_BONUS',
  'ACHIEVEMENT_BONUS',
  'POSITIVE_EMOTION',
]);

export const pointTransactions = pgTable('point_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  type: pointTransactionTypeEnums('type').notNull(),
  points: integer('points').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pointTransactionsRelations = relations(
  pointTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [pointTransactions.userId],
      references: [users.id],
    }),
  }),
);
