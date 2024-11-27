import { z } from 'zod';

export const ErrorDetailsSchema = z.object({
  message: z.string(),
  code: z.string(),
  path: z.array(z.string()).optional(),
  details: z.unknown().optional(),
});

export const ResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.enum(['success', 'error']),
    data: dataSchema.nullable(),
    errors: z.array(ErrorDetailsSchema).nullable(),
  });

export const ErrorResponseSchema = ResponseSchema(z.unknown());
export const DefaultResponseSchema = ResponseSchema(z.unknown());

export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type DefaultResponse = z.infer<typeof DefaultResponseSchema>;
