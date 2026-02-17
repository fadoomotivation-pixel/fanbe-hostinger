import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDj3rZtbvpldeunT8nYQ0v3wtIAtM23jmY",
  authDomain: "fanbe-crm.firebaseapp.com",
  projectId: "fanbe-crm",
  storageBucket: "fanbe-crm.firebasestorage.app",
  messagingSenderId: "518660896359",
  appId: "1:518660896359:web:ac728fe04d3a730ccd46c2",
  measurementId: "G-0H3KSCCTSN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Secondary Firebase app for creating users without disrupting admin session
// createUserWithEmailAndPassword auto-signs-in as the new user, so we use
// a separate app instance to keep the admin's auth session intact.
const secondaryApp = initializeApp(firebaseConfig, 'secondaryApp');

// Initialize Firebase services
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
export const db = getFirestore(app);

export default app;
