// 1. Importamos las librerías desde los servidores de Google (versión Web)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Tu configuración (Copiada de lo que me has pasado)
const firebaseConfig = {
  apiKey: "AIzaSyBmwfxAGq6dzy6RegYcWQHd4XgDgn1QJiM",
  authDomain: "fantasy-atletismo-26.firebaseapp.com",
  projectId: "fantasy-atletismo-26",
  storageBucket: "fantasy-atletismo-26.firebasestorage.app",
  messagingSenderId: "133833651406",
  appId: "1:133833651406:web:4e2841f58fd2a288c30c9f"
};

// 3. Inicializamos la App, la Autenticación y la Base de Datos
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);       // Esto activa el sistema de Login
const db = getFirestore(app);    // Esto activa la Base de Datos

// 4. Exportamos 'auth' y 'db' para poder usarlos en los otros archivos (auth.js, app.js, etc.)
export { auth, db };