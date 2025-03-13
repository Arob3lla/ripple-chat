import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "react-chat-8dc8f.firebaseapp.com",
  projectId: "react-chat-8dc8f",
  storageBucket: "react-chat-8dc8f.appspot.com",
  messagingSenderId: "662127626794",
  appId: "1:662127626794:web:ef7cd1c1a63f43eced1153",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
