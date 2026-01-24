import { getApps, initializeApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey) {
  console.error("Missing Firebase env: NEXT_PUBLIC_FIREBASE_API_KEY");
}
if (!firebaseConfig.authDomain) {
  console.error("Missing Firebase env: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
}
if (!firebaseConfig.projectId) {
  console.error("Missing Firebase env: NEXT_PUBLIC_FIREBASE_PROJECT_ID");
}
if (!firebaseConfig.storageBucket) {
  console.error("Missing Firebase env: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
}
if (!firebaseConfig.messagingSenderId) {
  console.error("Missing Firebase env: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
}
if (!firebaseConfig.appId) {
  console.error("Missing Firebase env: NEXT_PUBLIC_FIREBASE_APP_ID");
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
