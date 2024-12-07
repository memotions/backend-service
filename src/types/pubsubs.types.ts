import { z } from 'zod';

export const EmotionAnalysisSchema = z.object({
  emotion: z.string(),
  confidence: z.number(),
});

export const RawEventSchema = z.object({
  message: z.object({
    attributes: z.unknown(),
    data: z
      .string()
      .transform(val =>
        JSON.parse(
          Buffer.from(val, 'base64')
            .toString('utf-8')
            .replace(/\n/g, '')
            .trim(),
        ),
      ),
    messageId: z.string(),
    message_id: z.string(),
    publishTime: z.string(),
    publish_time: z.string(),
  }),
  subscription: z.string(),
});

export const DataEventSchema = z.object({
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

export type RawEvent = z.infer<typeof RawEventSchema>;
export type DataEvent = z.infer<typeof DataEventSchema>;
