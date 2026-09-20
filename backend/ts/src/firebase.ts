import admin from 'firebase-admin';
import { assertFirebaseConfig, config } from './config.js';

assertFirebaseConfig();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.clientEmail,
      privateKey: config.firebase.privateKey
    })
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export type FirestoreDocument = Record<string, unknown>;
