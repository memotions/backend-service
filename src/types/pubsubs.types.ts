import { z } from 'zod';

export const EmotionAnalysisSchema = z.object({
  emotion: z.string(),
  confidence: z.number(),
});

export const PubSubEventSchema = z.object({
  userId: z.number(),
  journalId: z.number(),
  journalContent: z.string(),
  emotionAnalysis: z
    .array(EmotionAnalysisSchema)
    .optional()
    .nullable()
    .transform(val => (val === null ? [] : val ?? [])),
  analyzedAt: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val === null ? '' : val ?? '')),
  feedback: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val === null ? '' : val ?? '')),
  createdAt: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val === null ? '' : val ?? '')),
});

export type PubSubEvent = z.infer<typeof PubSubEventSchema>;
