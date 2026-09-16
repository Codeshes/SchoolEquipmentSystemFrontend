import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxs0d7c0GkXB0SSSmW1PkfyuY0y0OghMU",
  authDomain: "school-equipment-managem-3538b.firebaseapp.com",
  projectId: "school-equipment-managem-3538b",
  storageBucket: "school-equipment-managem-3538b.firebasestorage.app",
  messagingSenderId: "1043094490302",
  appId: "1:1043094490302:web:3989f14c4c450b95f2e2ef",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();