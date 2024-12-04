import { NextFunction, Request, Response } from 'express';
import AuthService from '../services/auth.service';
import {
  AuthResponse,
  User,
  LoginUserSchema,
  RegisterUserSchema,
} from '../types/users.types';
import AchievementsService from '../services/achievements.service';
import Logger from '../utils/logger';

export default class AuthController {
  public static register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { name, email, password } = RegisterUserSchema.parse(req.body);

      const newUser = await AuthService.register(email, name, password);
      AchievementsService.processOnUserRegistered(newUser.user.id)
        .then(() => Logger.info('Registered user achievements processed'))
        .catch(error => Logger.error(error));

      const response: AuthResponse = {
        status: 'success',
        data: newUser,
        errors: null,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  public static login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { email, password } = LoginUserSchema.parse(req.body);

      const user = await AuthService.login(email, password);

      const response: AuthResponse = {
        status: 'success',
        data: user,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public static getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = req.user as User;
      const user = await AuthService.getProfile(id);

      const response: AuthResponse = {
        status: 'success',
        data: user,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public static loginWithGoogle = async (req: Request, res: Response) => {
    const { id } = req.user as User;
    const user = await AuthService.loginWithGoogle(id);

    const response: AuthResponse = {
      status: 'success',
      data: user,
      errors: null,
    };
    res.status(200).json(response);
  };
}
