import 'dotenv/config';
import admin from 'firebase-admin';
import path from 'path';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT || '';

const initializeFirebaseApp = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(path.resolve(serviceAccount)),
    });
  }
  return admin;
};

export default initializeFirebaseApp;
