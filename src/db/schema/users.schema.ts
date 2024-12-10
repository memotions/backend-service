import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { journals } from './journals.schema';
import { tags } from './tags.schema';
import { streaks } from './streaks.schema';
import { pointTransactions } from './points.schema';
import { userAchievements } from './achievements.schema';
import { userLevels } from './levels.schema';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull(),
  password: varchar('password').notNull(),
  fcmToken: varchar('fcm_token'),
});

export const usersRelations = relations(users, ({ many }) => ({
  journals: many(journals),
  tags: many(tags),
  streaks: many(streaks),
  pointTransactions: many(pointTransactions),
  userAchievements: many(userAchievements),
  userLevels: many(userLevels),
}));
