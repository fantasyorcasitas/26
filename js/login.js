import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Tu configuración de siempre
const firebaseConfig = {
  apiKey: "AIzaSyBmwfxAGq6dzy6RegYcWQHd4XgDgn1QJiM",
  authDomain: "fantasy-atletismo-26.firebaseapp.com",
  projectId: "fantasy-atletismo-26",
  storageBucket: "fantasy-atletismo-26.firebasestorage.app",
  messagingSenderId: "133833651406",
  appId: "1:133833651406:web:4e2841f58fd2a288c30c9f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Lógica del Login
const loginForm = document.querySelector('form'); // Seleccionamos el formulario

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evitar que la página se recargue sola

    // Cogemos los datos de los inputs (asegúrate que en tu HTML tengan estos IDs)
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = loginForm.querySelector('button');

    // Feedback visual
    const textoOriginal = btn.innerText;
    btn.innerText = "Entrando...";
    btn.disabled = true;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // === PASO CRÍTICO: GUARDAR LA LLAVE EN EL BOLSILLO ===
        // Guardamos el UID (Identificador único) en la memoria local
        localStorage.setItem('fantasy_user', user.uid);
        
        console.log("Login correcto. Usuario guardado:", user.uid);

        // Redirigir a la carpeta docs/home.html
        window.location.href = 'docs/home.html';

    } catch (error) {
        console.error(error);
        alert("Error al entrar: " + error.message);
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
});