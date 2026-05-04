import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  // On Vercel — uses env variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  // Local dev — uses the JSON file directly
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../service-account.json');
}

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(getServiceAccount()) });

export const adminDb = getFirestore(app);