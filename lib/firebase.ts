import { getApps, initializeApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVzgY_zpVcB1Mmp4CVdJq4l4nXzWzqMoA",
  authDomain: "unsaid-c7820.firebaseapp.com",
  projectId: "unsaid-c7820",
  storageBucket: "unsaid-c7820.firebasestorage.app",
  messagingSenderId: "354140400368",
  appId: "1:354140400368:web:c88c75fc807e36d28af035",
  measurementId: "G-J2GBNQZTT0"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
