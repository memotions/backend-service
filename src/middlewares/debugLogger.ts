import { NextFunction, Request, Response } from 'express';
import Logger from '../utils/logger';

const debugLogger = (req: Request, res: Response, next: NextFunction) => {
  if (Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };

    const sensitiveFields = ['password', 'token', 'secret'];
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '***MASKED***';
      }
    });

    Logger.debug(`Request Body: ${JSON.stringify(sanitizedBody)}`);
  }

  next();
};

export default debugLogger;
