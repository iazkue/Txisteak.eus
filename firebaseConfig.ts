
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ZURE Firebase proiektuaren konfigurazioarekin ordezkatu behar duzu.
// Gomendagarria da ingurune-aldagaiak erabiltzea informazio hau gordetzeko.
const firebaseConfig = {
  apiKey: "ZURE_API_KEY",
  authDomain: "zure-proiektua.firebaseapp.com",
  projectId: "zure-proiektuaren-id",
  storageBucket: "zure-proiektua.appspot.com",
  messagingSenderId: "zure-sender-id",
  appId: "zure-app-id",
  measurementId: "zure-measurement-id"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
