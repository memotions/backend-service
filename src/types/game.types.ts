import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { pointTransactions } from '../db/schema/points.schema';
import { streaks } from '../db/schema/streaks.schema';

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

export const CurrentPointsSchema = z.object({
  points: z.number(),
});

export const CurrentLevelSchema = z.object({
  currentLevel: z.number(),
  currentPoints: z.number(),
  nextLevel: z.number(),
  pointsRequired: z.number(),
});

export const CurrentStreakSchema = createSelectSchema(streaks).omit({
  id: true,
  userId: true,
});

export type AddPoints = z.infer<typeof AddPointsSchema>;
export type PointTransaction = z.infer<typeof PointTransactionSchema>;
export type CurrentPoints = z.infer<typeof CurrentPointsSchema>;
export type CurrentLevel = z.infer<typeof CurrentLevelSchema>;
export type CurrentStreak = z.infer<typeof CurrentStreakSchema>;
