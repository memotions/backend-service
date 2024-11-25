import { z } from 'zod';
import { Error } from '../validators/response.validator';
import { fromZodError } from 'zod-validation-error';

export const handleZodError = (error: z.ZodError): Error[] => {
  return error.issues.map((issue) => {
    let details: Record<string, any> | undefined = undefined;
    switch (issue.code) {
      case 'invalid_type':
        details = {
          expected: issue.expected,
          received: issue.received,
        };
        break;

      case 'invalid_literal':
        details = {
          expected: issue.expected,
          received: issue.received,
        };
        break;

      case 'too_small':
        details = {
          minimum: issue.minimum,
          inclusive: issue.inclusive,
          type: issue.type,
        };
        break;

      case 'too_big':
        details = {
          maximum: issue.maximum,
          inclusive: issue.inclusive,
          type: issue.type,
        };
        break;

      case 'invalid_string':
        details = {
          validation: issue.validation,
        };
        break;

      case 'invalid_enum_value':
        details = {
          options: issue.options,
          received: issue.received,
        };
        break;

      case 'not_multiple_of':
        details = {
          multipleOf: issue.multipleOf,
        };
        break;

      case 'not_finite':
        details = {
          message: 'Value must be finite.',
        };
        break;

      case 'invalid_union':
        details = {
          unionErrors: issue.unionErrors.map((err) => err.message),
        };
        break;

      case 'invalid_union_discriminator':
        details = {
          options: issue.options,
        };
        break;

      case 'invalid_date':
        details = {
          message: 'Invalid date format.',
        };
        break;

      default:
        details = {};
        break;
    }

    return {
      message: issue.message,
      code: issue.code,
      path: issue.path.length ? issue.path.map(String) : undefined,
      details,
    };
  });
};
