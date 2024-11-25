import { z } from 'zod';

export const ErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  path: z.array(z.string()).optional(),
  details: z.unknown().optional(),
});

export type Error = z.infer<typeof ErrorSchema>;

export const createResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.enum(['success', 'error']),
    data: dataSchema.nullable(),
    errors: z.array(ErrorSchema).nullable(),
  });
