import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { emotionAnalysis, emotions } from '../db/schema/emotions.schema';

export const EmotionSchema = createSelectSchema(emotions);
export const AddEmotionSchema = createInsertSchema(emotions);

export const EmotionAnalysisSchema = createSelectSchema(emotionAnalysis).omit({
  journalId: true,
});

export const AddEmotionAnalysisSchema = createInsertSchema(emotionAnalysis);

export type EmotionsCount = {
  happy: number;
  sad: number;
  neutral: number;
  angry: number;
  scared: number;
};

export type Emotion = z.infer<typeof EmotionSchema>;
export type EmotionAnalysis = z.infer<typeof EmotionAnalysisSchema>;
export type AddEmotion = z.infer<typeof AddEmotionSchema>;
