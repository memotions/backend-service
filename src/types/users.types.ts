import { z } from 'zod';
import { ResponseSchema } from './response.types';

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

export const RegisterUserSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  password: z.string().min(6),
});

export const LoginUserSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const GoogleAuthSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  googleId: z.string(),
});

export const AuthResponseSchema = ResponseSchema(
  z.object({
    user: UserSchema,
    token: z.string().optional(),
  }),
);

export type User = z.infer<typeof UserSchema>;
export type RegisterUser = z.infer<typeof RegisterUserSchema>;
export type LoginUser = z.infer<typeof LoginUserSchema>;
export type GoogleAuth = z.infer<typeof GoogleAuthSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
