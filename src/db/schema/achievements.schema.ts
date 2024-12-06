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

export const achievements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  code: varchar('code').notNull(),
  name: varchar('name').notNull(),
  iconUrl: varchar('icon_url').notNull(),
  type: varchar('type')
    .references(() => achievementTypes.type)
    .notNull(),
  criteria: integer('criteria').notNull(),
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
      .references(() => achievements.id),
    completedAt: timestamp('completed_at').defaultNow(),
  },
  table => [primaryKey({ columns: [table.userId, table.achievementId] })],
);

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(
  userAchievements,
  ({ one }) => ({
    user: one(users, {
      fields: [userAchievements.userId],
      references: [users.id],
    }),
    achievement: one(achievements, {
      fields: [userAchievements.achievementId],
      references: [achievements.id],
    }),
  }),
);
