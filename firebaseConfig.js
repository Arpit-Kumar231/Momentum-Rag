// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKRhMNgLcSMawI6zbiwG0OYewN-J3qslk",
  authDomain: "momentum-assignment.firebaseapp.com",
  projectId: "momentum-assignment",
  storageBucket: "momentum-assignment.appspot.com",
  messagingSenderId: "264596088447",
  appId: "1:264596088447:web:3eec5f8d304e13f0d9814a"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
export default db;