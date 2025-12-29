import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginForm = document.getElementById('loginForm');
const mensajeError = document.getElementById('mensajeError');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeError.innerText = "Entrando...";

    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // Si no falla, redirigimos
        window.location.href = "docs/home.html";
    } catch (error) {
        console.error(error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            mensajeError.innerText = "Correo o contraseña incorrectos.";
        } else {
            mensajeError.innerText = "Error al iniciar sesión.";
        }
    }
});