import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { emotionAnalysis, emotionClasses } from '../db/schema/emotions.schema';

export const EmotionSchema = createSelectSchema(emotionClasses);
export const AddEmotionSchema = createInsertSchema(emotionClasses);

export const EmotionAnalysisSchema = createSelectSchema(emotionAnalysis);

export const GroupedEmotionAnalysisSchema = z.object({
  journalId: z.number(),
  journalDatetime: z.date(),
  emotionAnalysis: z.array(
    z.object({
      emotion: z.string(),
      confidence: z.number(),
    }),
  ),
  analyzedAt: z.date(),
});

export const AddEmotionAnalysisSchema = createInsertSchema(
  emotionAnalysis,
).omit({
  journalId: true,
});

export type Emotion = z.infer<typeof EmotionSchema>;
export type EmotionAnalysis = z.infer<typeof EmotionAnalysisSchema>;
export type GroupedEmotionAnalysis = z.infer<
  typeof GroupedEmotionAnalysisSchema
>;
export type AddEmotionAnalysis = z.infer<typeof AddEmotionAnalysisSchema>;

export type EmotionsCount = {
  happy: number;
  sad: number;
  neutral: number;
  anger: number;
  scared: number;
};
