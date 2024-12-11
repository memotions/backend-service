import 'dotenv/config';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import Logger from '../utils/logger';

const serviceAccountUrl = process.env.FIREBASE_SERVICE_ACCOUNT_URL || '';

const initializeFirebaseApp = async () => {
  if (!admin.apps.length) {
    try {
      const response = await fetch(serviceAccountUrl);
      const buffer = await response.arrayBuffer();

      const tempFilePath = path.resolve(
        __dirname,
        'firebaseServiceAccount.json',
      );
      fs.writeFileSync(tempFilePath, Buffer.from(buffer));

      admin.initializeApp({
        credential: admin.credential.cert(tempFilePath),
      });

      fs.unlinkSync(tempFilePath);

      Logger.info('Firebase initialized successfully');
    } catch (error) {
      Logger.error('Failed to download or initialize Firebase:', error);
    }
  }
};

export default initializeFirebaseApp;
