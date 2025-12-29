import { auth, db } from "./firebase-config.js";
// Importamos signInWithEmailAndPassword para poder iniciar sesión
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const registroForm = document.getElementById('registroForm');
const mensajeError = document.getElementById('mensajeError');
const btnCambiarModo = document.getElementById('btnCambiarModo');
const grupoCodigo = document.getElementById('grupoCodigo'); // El div del input código
const codigoInput = document.getElementById('codigoInvitacion');
const tituloPrincipal = document.getElementById('tituloPrincipal');
const btnSubmit = document.getElementById('btnSubmit');
const textoPregunta = document.getElementById('textoPregunta');

// VARIABLE DE ESTADO: ¿Estamos en modo Login o Registro?
let esModoLogin = false; // Empezamos en Registro por defecto

// --- 1. LÓGICA PARA CAMBIAR DE MODO ---
btnCambiarModo.addEventListener('click', () => {
    esModoLogin = !esModoLogin; // Invertimos el valor

    if (esModoLogin) {
        // MODO LOGIN
        grupoCodigo.style.display = 'none'; // Ocultar campo código
        codigoInput.required = false;       // Quitar requisito
        tituloPrincipal.innerHTML = 'INICIAR<br><span>SESIÓN</span>';
        btnSubmit.innerHTML = 'ENTRAR <i class="fa-solid fa-arrow-right"></i>';
        textoPregunta.innerText = "¿Aún no tienes cuenta? ";
        btnCambiarModo.innerText = "Regístrate aquí";
        mensajeError.innerText = "";
    } else {
        // MODO REGISTRO
        grupoCodigo.style.display = 'block'; // Mostrar campo código
        codigoInput.required = true;         // Poner requisito
        tituloPrincipal.innerHTML = 'FANTASY<br><span>ATLETISMO</span>';
        btnSubmit.innerHTML = 'REGISTRARSE <i class="fa-solid fa-arrow-right"></i>';
        textoPregunta.innerText = "¿Ya tienes cuenta? ";
        btnCambiarModo.innerText = "Inicia Sesión aquí";
        mensajeError.innerText = "";
    }
});


// --- 2. ENVÍO DEL FORMULARIO ---
registroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeError.innerText = "Procesando...";
    
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    try {
        if (esModoLogin) {
            // ==============================
            // 🅰️ OPCIÓN A: INICIAR SESIÓN
            // ==============================
            await signInWithEmailAndPassword(auth, email, pass);
            // Si no da error, es que ha entrado bien
            window.location.href = "docs/home.html";

        } else {
            // ==============================
            // 🅱️ OPCIÓN B: REGISTRARSE
            // ==============================
            const codigo = codigoInput.value;

            // 1. Verificar código en BD
            const q = query(collection(db, "codigos"), where("codigo", "==", codigo));
            const querySnapshot = await getDocs(q);

            let codigoValido = false;
            let codigoId = "";
            let nombreOficial = "";

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.usado === false) {
                    codigoValido = true;
                    codigoId = doc.id;
                    nombreOficial = data.nombre_asignado;
                }
            });

            if (!codigoValido) throw new Error("Código no válido o ya usado.");

            // 2. Crear usuario
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const user = userCredential.user;

            // 3. Guardar datos
            await setDoc(doc(db, "usuarios", user.uid), {
                nombre_usuario: nombreOficial,
                email: email,
                presupuesto: 100000,
                puntos_totales: 0,
                equipo: [],
                rol: "user"
            });

            // 4. Quemar código
            await updateDoc(doc(db, "codigos", codigoId), { usado: true });

            alert(`¡Bienvenido, ${nombreOficial}!`);
            window.location.href = "docs/home.html";
        }

    } catch (error) {
        console.error(error);
        // Errores comunes traducidos
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            mensajeError.innerText = "Correo o contraseña incorrectos.";
        } else if (error.code === 'auth/email-already-in-use') {
            mensajeError.innerText = "Este correo ya está registrado. Prueba a Iniciar Sesión.";
        } else {
            mensajeError.innerText = error.message;
        }
    }
});