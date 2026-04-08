// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { collection, addDoc, getDocs } from "firebase/firestore"; 

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdNU07BJRQdxQY_KWJf6SLjy8xE-jJpi8",
  authDomain: "schedyoule-eb9b3.firebaseapp.com",
  projectId: "schedyoule-eb9b3",
  storageBucket: "schedyoule-eb9b3.firebasestorage.app",
  messagingSenderId: "924680185787",
  appId: "1:924680185787:web:26896a26a6879f2453c69e",
  measurementId: "G-EETQ3PL6EP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
