import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDQXjNdNHW4eU3k2j62zAHD_ZVbmqBGeAA",
  authDomain: "aquanics-b0760.firebaseapp.com",
  projectId: "aquanics-b0760",
  storageBucket: "aquanics-b0760.firebasestorage.app",
  messagingSenderId: "1062837814375",
  appId: "1:1062837814375:web:31c60d54a49cf0056d00c2",
  measurementId: "G-HDSDW0XJJM",
  databaseURL:
    "https://aquanics-b0760-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);

export default app;
