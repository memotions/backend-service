import { eq } from 'drizzle-orm';
import initializeFirebaseApp from '../config/firebase.config';
import db from '../db';
import { users } from '../db/schema/users.schema';
import Logger from '../utils/logger';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class NotificationService {
  private admin = initializeFirebaseApp();

  static async getFcmToken(userId: number): Promise<string | null> {
    const [{ fcmToken }] = await db
      .select({ fcmToken: users.fcmToken })
      .from(users)
      .where(eq(users.id, userId));
    return fcmToken;
  }

  async sendToDevice(
    deviceToken: string,
    payload: NotificationPayload,
  ): Promise<string | null> {
    try {
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        token: deviceToken,
      };

      const response = await this.admin.messaging().send(message);
      Logger.info(
        `Notification sent to device ${deviceToken} | Title: ${message.notification.title} | Body: ${message.notification.body}`,
      );
      return response;
    } catch (error) {
      Logger.error(
        `Error sending notification to device ${deviceToken}`,
        error,
      );
      throw error;
    }
  }

  async sendToUser(
    userId: number,
    payload: NotificationPayload,
  ): Promise<string | null> {
    try {
      const fcmToken = await NotificationService.getFcmToken(userId);

      if (!fcmToken) {
        Logger.warn(`User ${userId} does not have a FCM token`);
        return null;
      }

      const response = await this.sendToDevice(fcmToken, payload);
      Logger.info(
        `Notification sent to user ${userId} { title: ${payload.title}, body: ${payload.body}}`,
      );
      return response;
    } catch (error) {
      Logger.error(`Error sending notification to user ${userId}`, error);
      throw error;
    }
  }
}
