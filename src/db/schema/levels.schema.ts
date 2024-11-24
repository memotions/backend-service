import { pgTable, serial, integer, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const levels = pgTable('levels', {
  id: serial('id').primaryKey(),
  levelNumber: integer('level_number').notNull(),
  pointsRequired: integer('points_required').notNull(),
});

export const userLevels = pgTable(
  'user_levels',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    levelId: integer('level_id')
      .notNull()
      .references(() => levels.id),
  },
  (table) => [primaryKey({ columns: [table.userId, table.levelId] })],
);

export const levelsRelations = relations(levels, ({ many }) => ({
  userLevels: many(userLevels),
}));

export const userLevelsRelations = relations(userLevels, ({ one }) => ({
  user: one(users, {
    fields: [userLevels.userId],
    references: [users.id],
  }),
  level: one(levels, {
    fields: [userLevels.levelId],
    references: [levels.id],
  }),
}));
