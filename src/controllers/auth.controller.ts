import { Request, Response } from 'express';
import {
  loginUser,
  loginUserWithGoogle,
  registerUser,
} from '../services/auth.service';
import {
  AuthResponse,
  LoginUserSchema,
  RegisterUserSchema,
} from '../validators/users.validator';
import { z } from 'zod';
import { handleZodError } from '../utils/handleZodError';
import ApiError from '../utils/apiError';

export const registerController = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = RegisterUserSchema.parse(req.body);

    const newUser = await registerUser(email, name, password);

    const response: AuthResponse = {
      status: 'success',
      data: newUser,
      errors: null,
    };
    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = handleZodError(error);

      const response: AuthResponse = {
        status: 'error',
        data: null,
        errors,
      };
      res.status(400).json(response);
    } else if (error instanceof ApiError) {
      const response: AuthResponse = {
        status: 'error',
        data: null,
        errors: [{ code: error.code, message: error.message }],
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: AuthResponse = {
        status: 'error',
        data: null,
        errors: [{ code: 'SERVER_ERROR', message: 'Server error' }],
      };
      res.status(500).json(response);
    }
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = LoginUserSchema.parse(req.body);

    const user = await loginUser(email, password);

    res.status(200).json({ message: 'User logged in successfully', user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = handleZodError(error);

      const response: AuthResponse = {
        status: 'error',
        data: null,
        errors,
      };
      res.status(400).json(response);
    } else if (error instanceof ApiError) {
      const response: AuthResponse = {
        status: 'error',
        data: null,
        errors: [{ code: error.code, message: error.message }],
      };
      res.status(error.statusCode).json(response);
    } else {
      const response: AuthResponse = {
        status: 'error',
        data: null,
        errors: [{ code: 'SERVER_ERROR', message: 'Server error' }],
      };
      res.status(500).json(response);
    }
  }
};

export const loginWithGoogleController = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.user as { id: number };
  const user = await loginUserWithGoogle(id);

  const response: AuthResponse = {
    status: 'success',
    data: user,
    errors: null,
  };
  res.status(200).json(response);
};
