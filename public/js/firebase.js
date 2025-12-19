// js/firebase.js
import "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js";
import "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js";

const firebaseConfig = {
  apiKey: "AIzaSyDB-qF6Ac93Tj3LR3DI6aTuUtkFNRMDai0",
  authDomain: "panel-9e1a6.firebaseapp.com",
  projectId: "panel-9e1a6",
  storageBucket: "panel-9e1a6.firebasestorage.app",
  messagingSenderId: "491001640513",
  appId: "1:491001640513:web:ddbf48cf060ae10d0e38c0"
};

// ✅ Prevent double init
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
