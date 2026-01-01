import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const registroForm = document.getElementById('registroForm');
const mensajeError = document.getElementById('mensajeError');

registroForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeError.innerText = "Verificando código...";

    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const codigoInput = document.getElementById('codigoInvitacion').value;

    try {
        // 1. Verificar código en BD
        const q = query(collection(db, "codigos"), where("codigo", "==", codigoInput));
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

        // 3. Guardar datos en Firestore
        await setDoc(doc(db, "usuarios", user.uid), {
            nombre_usuario: nombreOficial,
            email: email,
            presupuesto: 100,
            puntos_total: 0,
            puntos_totales: 0,
            equipo: [],
            rol: "user"
        });

        // 4. Quemar código
        await updateDoc(doc(db, "codigos", codigoId), { usado: true });

        alert(`¡Cuenta creada! Bienvenido, ${nombreOficial}.`);
        window.location.href = "docs/home.html";

    } catch (error) {
        console.error(error);
        if (error.code === 'auth/email-already-in-use') {
            mensajeError.innerText = "Este correo ya existe. Ve a Iniciar Sesión.";
        } else {
            mensajeError.innerText = error.message;
        }
    }
});