import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { AuthResponse } from '../types/users.types';

const authHandler = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', (err: any, user: any) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      const response: AuthResponse = {
        status: 'error',
        data: null,
        errors: [{ code: 'UNAUTHORIZED', message: 'Unauthorized' }],
      };
      return res.status(401).json(response);
    }

    req.user = user;
    return next();
  })(req, res, next);
};

export default authHandler;
