// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
        apiKey: "AIzaSyDpC7nL90nEUjooE6tN6lxLVleddzvhKf8",
        authDomain: "compraya-d0760.firebaseapp.com",
        projectId: "compraya-d0760",
        storageBucket: "compraya-d0760.firebasestorage.app",
        messagingSenderId: "741576296960",
        appId: "1:741576296960:web:46714b2a883293bc7d26e5",
        measurementId: "G-FXQZVDH85F"
    };


// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);