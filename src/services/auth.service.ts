import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { VerifiedCallback } from 'passport-jwt';
import db from '../db';
import { users } from '../db/schema/users.schema';
import AppError from '../utils/appError';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export default class AuthService {
  public static generateToken(userId: number) {
    return jwt.sign({ id: userId }, JWT_SECRET);
  }

  public static register = async (
    email: string,
    name: string,
    password: string,
    fcmToken?: string | null,
  ) => {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (user) {
      throw new AppError('USER_ALREADY_EXISTS', 409, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        name,
        password: hashedPassword,
        fcmToken,
      })
      .returning();

    return {
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
      token: this.generateToken(newUser.id),
    };
  };

  public static login = async (
    email: string,
    password: string,
    fcmToken?: string | null,
  ) => {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (fcmToken) {
      await db.update(users).set({ fcmToken }).where(eq(users.email, email));
    }

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 404, 'User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);

    if (!isPasswordValid) {
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid credentials');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: this.generateToken(user.id),
    };
  };

  public static logout = async (userId: number) => {
    await db.update(users).set({ fcmToken: null }).where(eq(users.id, userId));
  };

  public static getProfile = async (userId: number) => {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token: this.generateToken(user.id),
    };
  };

  public static jwtVerifyCallback = async (
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
}
