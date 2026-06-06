import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import {getFirestore} from "firebase/firestore"
import {getAnalytics} from "firebase/analytics"


const firebaseonfig = {
    apiKey: "AIzaSyC6V0gJ6yKVhPSCy7ThMU9rosODPxT3S8U",
    authDomain: "socialmedia-eee6e.firebaseapp.com",
    projectId: "socialmedia-eee6e",
    storageBucket: "socialmedia-eee6e.firebasestorage.app",
    messagingSenderId: "817199134855",
    appId: "1:817199134855:web:5e6be869ed0e407bdc6022",
    measurementId: "G-6KY2TQCMHM"
}

export const app = initializeApp(firebaseonfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const analytics = getAnalytics(app)