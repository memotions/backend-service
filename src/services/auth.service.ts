import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { VerifiedCallback } from 'passport-jwt';
import { VerifyCallback } from 'passport-google-oauth20';
import db from '../db';
import { users } from '../db/schema/users.schema';
import ApiError from '../utils/apiError';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const generateToken = (userId: number) =>
  jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '24h',
  });

export const registerUser = async (
  email: string,
  name: string,
  password: string,
) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (user) {
    throw new ApiError('USER_ALREADY_EXISTS', 409, 'User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({
      email,
      name,
      password: hashedPassword,
    })
    .returning();

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    token: generateToken(newUser.id),
  };
};

export const loginUser = async (email: string, password: string) => {
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) {
    throw new ApiError('USER_NOT_FOUND', 404, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password!);

  if (!isPasswordValid) {
    throw new ApiError('INVALID_CREDENTIALS', 401, 'Invalid credentials');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    token: generateToken(user.id),
  };
};

export const loginUserWithGoogle = async (userId: number) => {
  const token = generateToken(userId);
  const [{ id, name, email }] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));
  return { id, name, email, token };
};

export const jwtVerifyCallback = async (
  payload: any,
  done: VerifiedCallback,
) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id));

    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
};

export const googleVerifyCallback = async (
  accessToken: string,
  refreshToken: string,
  profile: any,
  done: VerifyCallback,
) => {
  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, profile.emails[0].value));

    if (existingUser) {
      return done(null, existingUser);
    }

    const [newUser] = await db
      .insert(users)
      .values({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
      })
      .returning();

    return done(null, newUser);
  } catch (error) {
    return done(error, false);
  }
};
