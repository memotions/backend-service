import { z } from 'zod';

export const EmotionSchema = z .object({
  result: z.string(),
  confidence: z.number()
});

export const PubsubEventSchema = z.object({
  userId: z.number(),
  journalId: z.number(),
  journal: z.string(),
  emotion: z
    .array(EmotionSchema)
    .optional()
    .nullable()
    .transform(val => (val === null ? [] : val ?? [])),
  analyzedAt: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val === null ? "" : val ?? "")),
  feedback: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val === null ? "" : val ?? "")),
  createdAt: z
    .string()
    .optional()
    .nullable()
    .transform(val => (val === null ? "" : val ?? "")),
});


export type PubsubEvent = z.infer<typeof PubsubEventSchema>;
