// src/firebase.js (o .ts)
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY", // Obtén esto de la consola de Firebase
  authDomain: "txisteakeus.firebaseapp.com",
  projectId: "txisteakeus",
  storageBucket: "txisteakeus.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Obtén una instancia de Firestore
export const db = getFirestore(app);
