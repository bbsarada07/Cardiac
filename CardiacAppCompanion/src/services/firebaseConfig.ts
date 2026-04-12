import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// TODO: Replace with your actual Firebase config object
const firebaseConfig = {
  apiKey: "AIzaSyDJBuSKL0ikZCfl3pvKJ6yEz7GJwW0BQFA",
  authDomain: "cardiacmonitor-fee48.firebaseapp.com",
  databaseURL: "https://cardiacmonitor-fee48-default-rtdb.firebaseio.com",
  projectId: "cardiacmonitor-fee48",
  storageBucket: "cardiacmonitor-fee48.firebasestorage.app",
  messagingSenderId: "354280360793",
  appId: "1:354280360793:web:bbe809281f79fa3da95a48",
  measurementId: "G-0HDEEWDNCJ"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
