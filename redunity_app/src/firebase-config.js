// Firebase Configuration for RedUnity App
// Project: redunity-f080a

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCGSfi4daeKyHhdKKu35WrHPavmVysUSjs",
  authDomain: "redunity-f080a.firebaseapp.com",
  projectId: "redunity-f080a",
  storageBucket: "redunity-f080a.firebasestorage.app",
  messagingSenderId: "350557240174",
  appId: "1:350557240174:web:71e8132c7475f4c25c9f7f",
  measurementId: "G-Y4Q7SVN1SF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with proper settings
const auth = getAuth(app);
auth.languageCode = 'en';

// Initialize Firestore with robust connection fallback
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true
});

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

console.log('Firebase config loaded:', { app: !!app, auth: !!auth, db: !!db });

export { app, auth, db, analytics };