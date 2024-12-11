import path from 'path';
import admin from 'firebase-admin';

const serviceAccountPath = path.join(
  __dirname,
  '..',
  '..',
  'firebaseServiceAccount.json',
);

const initializeFirebaseApp = () => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
  }
  return admin;
};

export default initializeFirebaseApp;
