import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { createResponseSchema } from './response.validator';
import { z } from 'zod';
import { users } from '../db/schema/users.schema';

const InsertUserSchema = createInsertSchema(users);
const SelectUserSchema = createSelectSchema(users);

export const RegisterUserSchema = InsertUserSchema.pick({
  email: true,
  name: true,
  password: true,
}).extend({
  password: z.string().min(6),
});

export const LoginUserSchema = SelectUserSchema.pick({
  email: true,
  password: true,
}).extend({
  password: z.string(),
});

export const GoogleAuthSchema = SelectUserSchema.pick({
  email: true,
  name: true,
  googleId: true,
}).extend({
  googleId: z.string(),
});

export type RegisterUser = z.infer<typeof RegisterUserSchema>;
export type LoginUser = z.infer<typeof LoginUserSchema>;
export type GoogleAuth = z.infer<typeof GoogleAuthSchema>;

const AuthResponseSchema = createResponseSchema(
  z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    token: z.string(),
  }),
);

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const ExpressUserSchema = z.object({
  id: z.number(),
});
export type ExpressUser = z.infer<typeof ExpressUserSchema>;
