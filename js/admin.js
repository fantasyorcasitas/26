import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from "./firebase-config.js"; // Asegúrate de importar auth también
import { collection, addDoc, getDocs, orderBy, query, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// === SEGURIDAD: EL PORTERO DE DISCOTECA ===
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. El usuario está logueado, vamos a ver quién es en la BD
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // 2. ¿TIENE EL ROL DE ADMIN?
            if (data.rol !== "admin") {
                // SI NO ES ADMIN -> ¡FUERA!
                document.body.innerHTML = "<h1>⛔ ACCESO DENEGADO</h1><p>Redirigiendo...</p>";
                setTimeout(() => {
                    window.location.href = "../docs/home.html";
                }, 1000);
            } else {
                // SI ES ADMIN -> Le dejamos pasar (cargamos cosas)
                console.log("Bienvenido, Admin supremo.");
                cargarSelectorAtletas(); // Solo cargamos los datos si es admin
            }
        }
    } else {
        // Ni siquiera está logueado -> Al login
        window.location.href = "../index.html";
    }
});

// ... (Aquí sigue el resto de tu código de cargarSelectorAtletas, etc.)
// === VARIABLES GLOBALES ===
// Aquí guardaremos temporalmente los atletas que vamos añadiendo a la competición
let listaParticipantes = []; 

// === 1. CARGAR ATLETAS EN EL SELECTOR (Al iniciar) ===
async function cargarSelectorAtletas() {
    const selector = document.getElementById('selectorAtletasBD');
    selector.innerHTML = '<option value="">Cargando...</option>';

    try {
        // Pedimos los atletas ordenados por nombre
        const q = query(collection(db, "atletas"), orderBy("nombre"));
        const querySnapshot = await getDocs(q);

        selector.innerHTML = '<option value="">-- Selecciona un Atleta --</option>';

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Creamos la opción. El value es el ID de firebase, el texto es Nombre + Apellido
            const option = document.createElement('option');
            option.value = doc.id; 
            option.text = `${data.nombre} ${data.apellidos} (${data.categoria})`;
            // Guardamos el nombre completo en un atributo extra para usarlo luego
            option.setAttribute('data-nombre-completo', `${data.nombre} ${data.apellidos}`);
            selector.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando atletas:", error);
        selector.innerHTML = '<option>Error al cargar</option>';
    }
}

// Ejecutar carga al abrir la página
window.addEventListener('DOMContentLoaded', cargarSelectorAtletas);


// === 2. GUARDAR NUEVO ATLETA ===
const formAtleta = document.getElementById('formAtleta');

formAtleta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = formAtleta.querySelector('button');
    btn.innerText = "Guardando...";
    btn.disabled = true;

    try {
        await addDoc(collection(db, "atletas"), {
            nombre: document.getElementById('atlNombre').value,
            apellidos: document.getElementById('atlApellidos').value,
            categoria: document.getElementById('atlCategoria').value,
            precio: Number(document.getElementById('atlPrecio').value),
            foto: document.getElementById('atlFoto').value || "https://cdn-icons-png.flaticon.com/512/74/74472.png",
            puntos: 0, // Siempre empieza en 0
            tendencia: "neutral"
        });

        alert("✅ Atleta creado correctamente");
        formAtleta.reset();
        cargarSelectorAtletas(); // Recargamos el selector para que salga el nuevo

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.innerText = "GUARDAR ATLETA";
        btn.disabled = false;
    }
});


// === 3. LÓGICA DE LA COMPETICIÓN (Añadir a lista temporal) ===
const btnAddLineup = document.getElementById('btnAddLineup');
const listaVisual = document.getElementById('listaVisual');

btnAddLineup.addEventListener('click', () => {
    const selector = document.getElementById('selectorAtletasBD');
    const inputPrueba = document.getElementById('inputPruebaEspecifica');
    
    const idAtleta = selector.value;
    const nombreAtleta = selector.options[selector.selectedIndex]?.getAttribute('data-nombre-completo');
    const prueba = inputPrueba.value;

    if (!idAtleta || !prueba) {
        alert("⚠️ Selecciona un atleta y escribe la prueba (ej: 100m)");
        return;
    }

    // Añadimos al array global
    listaParticipantes.push({
        id_atleta: idAtleta,
        nombre_completo: nombreAtleta, // Guardamos el nombre para no tener que buscarlo luego
        prueba: prueba,
        resultado: null // Se rellenará cuando acabe la compe
    });

    // Dibujamos en la cajita negra para que veas quién está
    actualizarListaVisual();
    
    // Limpiamos el input de prueba
    inputPrueba.value = "";
});

function actualizarListaVisual() {
    if (listaParticipantes.length === 0) {
        listaVisual.innerHTML = '<p style="color: #666; text-align: center;">Ningún atleta añadido aún</p>';
        return;
    }
    
    listaVisual.innerHTML = ""; // Limpiar
    listaParticipantes.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'lineup-item';
        div.innerHTML = `
            ${item.nombre_completo} <span>${item.prueba}</span>
            <span style="color: red; cursor: pointer; font-weight: bold;" onclick="eliminarDeLista(${index})">X</span>
        `;
        listaVisual.appendChild(div);
    });
}

// Función para borrar alguien si te equivocas (necesita estar en window para llamarse desde el HTML string)
window.eliminarDeLista = (index) => {
    listaParticipantes.splice(index, 1);
    actualizarListaVisual();
};


// === 4. GUARDAR COMPETICIÓN FINAL ===
const formCompe = document.getElementById('formCompe');

formCompe.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (listaParticipantes.length === 0) {
        if(!confirm("⚠️ ¿Seguro que quieres crear una competición sin atletas?")) return;
    }

    const btn = formCompe.querySelector('button[type="submit"]');
    btn.innerText = "Creando Competición...";
    btn.disabled = true;

    try {
        await addDoc(collection(db, "competiciones"), {
            nombre: document.getElementById('compNombre').value,
            lugar: document.getElementById('compLugar').value,
            fecha: document.getElementById('compFecha').value,
            pruebas_resumen: document.getElementById('compPruebasTexto').value,
            participantes: listaParticipantes, // AQUÍ VA EL ARRAY CON TUS DATOS
            estado: "pendiente" // pendiente -> finalizada (cuando pongas resultados)
        });

        alert("🏆 Competición creada exitosamente");
        formCompe.reset();
        listaParticipantes = []; // Vaciamos array
        actualizarListaVisual();

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        btn.innerText = "GUARDAR COMPETICIÓN";
        btn.disabled = false;
    }
});