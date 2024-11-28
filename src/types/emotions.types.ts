import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { emotionAnalysis, emotions } from '../db/schema/emotions.schema';

export const EmotionSchema = createSelectSchema(emotions);
export const AddEmotionSchema = createInsertSchema(emotions);

export const EmotionAnalysisSchema = createSelectSchema(emotionAnalysis)
  .extend({
    emotion: EmotionSchema,
  })
  .omit({
    emotionId: true,
    journalId: true,
  });

export const AddEmotionAnalysisSchema = createInsertSchema(emotionAnalysis);

export type Emotion = z.infer<typeof EmotionSchema>;
export type EmotionAnalysis = z.infer<typeof EmotionAnalysisSchema>;
export type AddEmotion = z.infer<typeof AddEmotionSchema>;
