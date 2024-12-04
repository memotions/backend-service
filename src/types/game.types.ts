import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { pointTransactions } from '../db/schema/points.schema';
import { streaks } from '../db/schema/streaks.schema';
import { achievements } from '../db/schema/achievements.schema';

export const PointTransactionSchema = createSelectSchema(
  pointTransactions,
).omit({
  userId: true,
});

export const AddPointsSchema = createInsertSchema(pointTransactions).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const CurrentStreakSchema = createSelectSchema(streaks).omit({
  id: true,
  userId: true,
});

export const AchievementSchema = createSelectSchema(achievements).extend({
  completed: z.boolean(),
});

export type AddPoints = z.infer<typeof AddPointsSchema>;
export type PointTransaction = z.infer<typeof PointTransactionSchema>;
export type CurrentStreak = z.infer<typeof CurrentStreakSchema>;
export type Achievement = z.infer<typeof AchievementSchema>;

export type CurrentPoints = {
  totalPoints: number;
};

export type CurrentLevel = {
  currentLevel: number;
  totalPoints: number;
  nextLevel: number;
  pointsRequired: number;
};

export type Stats = {
  journalsCount: number;
  currentStreak: CurrentStreak;
  currentLevel: CurrentLevel;
  achievementsCount: {
    completed: number;
    total: number;
  };
  emotions: {
    happy: number;
    sad: number;
    anger: number;
    scared: number;
    neutral: number;
  };
};
