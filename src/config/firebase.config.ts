import path from 'path';
import admin from 'firebase-admin';

const serviceAccountPath = path.join(
  __dirname,
  '..',
  '..',
  'serviceAccount.json',
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
