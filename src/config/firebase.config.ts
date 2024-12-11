import 'dotenv/config';
import admin from 'firebase-admin';

const initializeFirebaseApp = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  return admin;
};

export default initializeFirebaseApp;
