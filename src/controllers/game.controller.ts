import { NextFunction, Request, Response } from 'express';
import GameService from '../services/game.service';
import { User } from '../types/users.types';
import {
  Achievement,
  CurrentLevel,
  CurrentPoints,
  CurrentStreak,
  Stats,
} from '../types/game.types';
import { DefaultResponse } from '../types/response.types';

export default class GameController {
  public static async getCurrentStreak(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;

      const currentStreak = await GameService.getCurrentStreak(userId);

      const response: DefaultResponse<CurrentStreak> = {
        status: 'success',
        data: currentStreak,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async getCurrentPoints(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;

      const currentPoints = await GameService.getCurrentPoints(userId);

      const response: DefaultResponse<CurrentPoints> = {
        status: 'success',
        data: currentPoints,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async getCurrentLevel(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;

      const currentLevel = await GameService.getCurrentLevel(userId);

      const response: DefaultResponse<CurrentLevel> = {
        status: 'success',
        data: currentLevel,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async getStats(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;

      const stats = await GameService.getStats(userId);

      const response: DefaultResponse<Stats> = {
        status: 'success',
        data: stats,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async getAchievements(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;

      const achievements = await GameService.getAchievements(userId);

      const response: DefaultResponse<Achievement[]> = {
        status: 'success',
        data: achievements,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
