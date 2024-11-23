import { relations } from 'drizzle-orm';
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const achievementTierEnums = pgEnum('achievement_tier', [
  'BRONZE',
  'SILVER',
  'GOLD',
  'SPECIAL',
]);

export const pointTransactionTypeEnums = pgEnum('point_transaction_type', [
  'JOURNAL_ENTRY',
  'STREAK_BONUS',
  'ACHIEVEMENT_BONUS',
  'POSITIVE_EMOTION',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull(),
  username: varchar('username').notNull(),
  password: varchar('password').notNull(),
});

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
      .references(() => tags.id),
  },
  (table) => [primaryKey({ columns: [table.journalId, table.tagId] })],
);

export const emotions = pgTable('emotions', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
});

export const emotionAnalysis = pgTable('emotion_analysis', {
  id: serial('id').primaryKey(),
  journalId: integer('journal_id')
    .notNull()
    .references(() => journals.id),
  emotionId: integer('emotion_id')
    .notNull()
    .references(() => emotions.id),
  confidence: numeric('confidence').notNull(),
  analyzedAt: timestamp('analyzed_at').notNull(),
});

export const journalFeedbacks = pgTable('journal_feedbacks', {
  id: serial('id').primaryKey(),
  journalId: integer('journal_id')
    .notNull()
    .references(() => journals.id),
  feedback: text('feedback').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const streaks = pgTable('streaks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const achivements = pgTable('achievements', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  description: varchar('description').notNull(),
  tier: achievementTierEnums('tier').notNull(),
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
    create: timestamp('completed_at'),
  },
  (table) => [primaryKey({ columns: [table.userId, table.achievementId] })],
);

export const pointTransactions = pgTable('point_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  type: pointTransactionTypeEnums('type').notNull(),
  points: integer('points').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

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

export const usersRelations = relations(users, ({ many }) => ({
  journals: many(journals),
  tags: many(tags),
  streaks: many(streaks),
  pointTransactions: many(pointTransactions),
  userAchievements: many(userAchievements),
  userLevels: many(userLevels),
}));

export const journalsRelations = relations(journals, ({ one, many }) => ({
  user: one(users, {
    fields: [journals.userId],
    references: [users.id],
  }),
  journalTags: many(journalTags),
  emotionAnalysis: many(emotionAnalysis),
  feedbacks: many(journalFeedbacks),
}));

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

export const emotionsRelations = relations(emotions, ({ many }) => ({
  emotionAnalysis: many(emotionAnalysis),
}));

export const emotionAnalysisRelations = relations(
  emotionAnalysis,
  ({ one }) => ({
    journal: one(journals, {
      fields: [emotionAnalysis.journalId],
      references: [journals.id],
    }),
    emotion: one(emotions, {
      fields: [emotionAnalysis.emotionId],
      references: [emotions.id],
    }),
  }),
);

export const journalFeedbacksRelations = relations(
  journalFeedbacks,
  ({ one }) => ({
    journal: one(journals, {
      fields: [journalFeedbacks.journalId],
      references: [journals.id],
    }),
  }),
);

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achivements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

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

export const pointTransactionsRelations = relations(
  pointTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [pointTransactions.userId],
      references: [users.id],
    }),
  }),
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
