import { NextFunction, Request, Response } from 'express';
import { User } from '../types/users.types';
import EmotionAnalysisService from '../services/emotionsAnalysis.service';
import { DefaultSuccessResponse } from '../types/response.types';
import { GroupedEmotionAnalysis } from '../types/emotions.types';

export default class EmotionAnalysisController {
  public static async getEmotionAnalysis(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;

      const groupedEmotionAnalysis =
        await EmotionAnalysisService.getGroupedEmotionAnalysis(userId);

      const response: DefaultSuccessResponse<GroupedEmotionAnalysis[]> = {
        status: 'success',
        data: groupedEmotionAnalysis,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
