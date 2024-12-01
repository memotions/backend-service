import { NextFunction, Request, Response } from 'express';
import { AddTagSchema, TagResponse, TagsResponse } from '../types/tags.types';
import { User } from '../types/users.types';
import TagsService from '../services/tags.service';

export default class TagsController {
  public static async addTag(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: userId } = req.user as User;
      const tag = AddTagSchema.parse(req.body);

      tag.name = tag.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const newTag = await TagsService.addTag(userId, tag);

      const response: TagResponse = {
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

      const response: TagsResponse = {
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

      const response: TagResponse = {
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
      const response: TagResponse = {
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
