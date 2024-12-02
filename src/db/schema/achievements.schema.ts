import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users.schema';

export const achievementTypes = pgTable('achievement_types', {
  type: varchar('type').primaryKey(),
});

export const achivements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  type: varchar('type')
    .references(() => achievementTypes.type)
    .notNull(),
  description: varchar('description').notNull(),
  tier: integer('tier').notNull(),
  pointsAwarded: integer('points_awarded').notNull(),
});

export const userAchievements = pgTable(
  'user_achievements',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    achievementId: integer('achievement_id')
      .notNull()
      .references(() => achivements.id),
    completedAt: timestamp('completed_at'),
  },
  table => [primaryKey({ columns: [table.userId, table.achievementId] })],
);

export const achievementsRelations = relations(
  achivements,
  ({ many, one }) => ({
    userAchievements: many(userAchievements),
    type: one(achievementTypes, {
      fields: [achivements.type],
      references: [achievementTypes.type],
    }),
  }),
);

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(users, {
      fields: [userAchievements.userId],
      references: [users.id],
    }),
    achievement: one(achivements, {
      fields: [userAchievements.achievementId],
      references: [achivements.id],
    }),
  }),
);
