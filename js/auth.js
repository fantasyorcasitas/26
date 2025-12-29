import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const registroForm = document.getElementById('registroForm');
const mensajeError = document.getElementById('mensajeError');

registroForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Recoger datos (YA NO PEDIMOS EL NOMBRE)
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const codigoInput = document.getElementById('codigoInvitacion').value;

    mensajeError.innerText = "Verificando identidad...";

    try {
        // 2. BUSCAR EL CÓDIGO
        const q = query(collection(db, "codigos"), where("codigo", "==", codigoInput));
        const querySnapshot = await getDocs(q);

        let codigoValido = false;
        let codigoId = "";
        let nombreOficial = ""; // Variable para guardar el nombre real

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.usado === false) {
                codigoValido = true;
                codigoId = doc.id;
                nombreOficial = data.nombre_asignado; // ¡AQUÍ ESTÁ LA CLAVE!
            }
        });

        if (!codigoValido) {
            throw new Error("Código no válido, ya usado o no asignado.");
        }

        // 3. CREAR USUARIO EN FIREBASE AUTH
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;

        // 4. GUARDAR DATOS USANDO EL NOMBRE OFICIAL (NO EL QUE ELIJA ÉL)
        await setDoc(doc(db, "usuarios", user.uid), {
            nombre_usuario: nombreOficial, // Usamos el nombre que pusiste tú en la BD
            email: email,
            presupuesto: 100000,
            puntos_totales: 0,
            equipo: [],
            rol: "user"
        });

        // 5. MARCAR CÓDIGO COMO USADO
        const codigoRef = doc(db, "codigos", codigoId);
        await updateDoc(codigoRef, {
            usado: true
        });

        alert(`¡Identidad verificada! Bienvenido, ${nombreOficial}.`);
        window.location.href = "docs/home.html";

    } catch (error) {
        console.error(error);
        // Traducir errores comunes de Firebase al español
        if (error.code === 'auth/email-already-in-use') {
            mensajeError.innerText = "Este correo ya está registrado.";
        } else if (error.code === 'auth/weak-password') {
            mensajeError.innerText = "La contraseña debe tener al menos 6 caracteres.";
        } else {
            mensajeError.innerText = error.message;
        }
    }
});