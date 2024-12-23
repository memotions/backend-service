import { NextFunction, Request, Response } from 'express';
import { AddTagSchema, Tag } from '../types/tags.types';
import { User } from '../types/users.types';
import TagsService from '../services/tags.service';
import { DefaultSuccessResponse } from '../types/response.types';

export default class TagsController {
  public static async addTag(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: userId } = req.user as User;
      const tag = AddTagSchema.parse(req.body);

      const newTag = await TagsService.addTag(userId, tag.name);

      const response: DefaultSuccessResponse<Tag> = {
        status: 'success',
        data: newTag,
        errors: null,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async findAllTags(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;

      const allTags = await TagsService.findAllTags(userId);

      const response: DefaultSuccessResponse<Tag[]> = {
        status: 'success',
        data: allTags,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async findTagById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;
      const tagId = Number(req.params.tagId);

      const tag = await TagsService.findTagById(userId, tagId);

      const response: DefaultSuccessResponse<Tag> = {
        status: 'success',
        data: tag,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  public static async deleteTagById(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const { id: userId } = req.user as User;
      const tagId = Number(req.params.tagId);

      const deletedTag = await TagsService.deleteTagById(userId, Number(tagId));
      const response: DefaultSuccessResponse<Tag> = {
        status: 'success',
        data: deletedTag,
        errors: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
