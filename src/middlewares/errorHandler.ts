import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import AppError from '../utils/appError';
import { ErrorDetails, DefaultErrorResponse } from '../types/response.types';
import Logger from '../utils/logger';

const zodErrorHandler = (error: z.ZodError): ErrorDetails[] =>
  error.issues.map(issue => {
    let details: Record<string, any> | undefined;
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
          unionDeErrorDetailss: issue.unionErrors.map(err => err.message),
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
      code: issue.code.toUpperCase(),
      path: issue.path.length ? issue.path.map(String) : undefined,
      details,
    };
  });

const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  Logger.error(error.message);

  if (error instanceof z.ZodError) {
    const errors = zodErrorHandler(error);

    const response: DefaultErrorResponse = {
      status: 'error',
      data: null,
      errors,
    };
    res.status(400).json(response);
  } else if (error instanceof AppError) {
    const response: DefaultErrorResponse = {
      status: 'error',
      data: null,
      errors: [{ code: error.code, message: error.message }],
    };
    res.status(error.statusCode).json(response);
  } else if (error instanceof Error) {
    const response: DefaultErrorResponse = {
      status: 'error',
      data: null,
      errors: [{ code: 'SERVER_ERROR', message: 'Server error' }],
    };
    res.status(500).json(response);
  } else {
    next(error);
  }
};

export default errorHandler;
