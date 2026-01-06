import { db, auth } from "./firebase-config.js"; 
import { 
    collection, 
    addDoc, 
    getDocs, 
    orderBy, 
    query, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ... el resto de tu código ...

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
// === 2. GUARDAR NUEVO ATLETA ===
const formAtleta = document.getElementById('formAtleta');

formAtleta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = formAtleta.querySelector('button');
    btn.innerText = "Guardando...";
    btn.disabled = true;

    try {
        // Capturamos el precio en una variable para usarlo en el array también
        const precioInicial = Number(document.getElementById('atlPrecio').value);

        await addDoc(collection(db, "atletas"), {
            nombre: document.getElementById('atlNombre').value,
            apellidos: document.getElementById('atlApellidos').value,
            categoria: document.getElementById('atlCategoria').value,
            precio: precioInicial,
            foto: document.getElementById('atlFoto').value || "https://cdn-icons-png.flaticon.com/512/74/74472.png",
            
            // Campos básicos
            puntos: 0, 
            tendencia: "neutral",

            // --- NUEVOS CAMPOS PARA LAS GRÁFICAS ---
            historial_puntos: [],            // Array vacío (aún no ha jugado)
            historial_valor: [precioInicial] // Array con el primer precio (el de salida)
        });

        alert("✅ Atleta creado correctamente");
        formAtleta.reset();
        cargarSelectorAtletas(); 

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
// === FUNCIÓN ARREGLADA: CARGAR CHECKBOXES PARA CIERRE ===
        async function cargarCheckboxesPendientes() {
            const container = document.getElementById('checklistCompes');
            container.innerHTML = '<p style="color:#aaa; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Buscando competiciones...</p>';

            try {
                // 1. CAMBIO CLAVE: Pedimos TODAS ordenadas por fecha (sin 'where')
                // Esto evita el error de "Missing Index" de Firebase
                const q = query(collection(db, "competiciones"), orderBy("fecha", "asc"));
                const snap = await getDocs(q);
                
                let html = '';
                let contadorPendientes = 0;

                snap.forEach(doc => {
                    const d = doc.data();
                    
                    // 2. FILTRO MANUAL (JavaScript): Solo procesamos si está pendiente
                    if (d.estado === 'pendiente') {
                        contadorPendientes++;
                        
                        // Guardamos los participantes en el dataset para usarlos al cerrar
                        const jsonParticipantes = JSON.stringify(d.participantes || []).replace(/"/g, '&quot;');
                        
                        html += `
                            <div class="check-item">
                                <label style="display:flex; align-items:center; width:100%; cursor:pointer;">
                                    <div style="display:flex; align-items:center; flex-grow:1;">
                                        <input type="checkbox" class="comp-checkbox" value="${doc.id}" data-participantes="${jsonParticipantes}" style="width:20px; height:20px; margin-right:15px; accent-color:#ff5e00;">
                                        <span style="color:white; font-weight:600;">${d.nombre}</span>
                                    </div>
                                    <span class="check-date" style="color:#888; font-size:0.85rem;">${d.fecha}</span>
                                </label>
                            </div>
                        `;
                    }
                });

                // 3. Feedback visual si no hay nada
                if (contadorPendientes === 0) {
                    container.innerHTML = `
                        <div style="text-align:center; padding:20px; color:#666;">
                            <i class="fa-solid fa-check-circle" style="font-size:2rem; margin-bottom:10px;"></i><br>
                            No hay competiciones pendientes.
                        </div>`;
                    const btn = document.getElementById('btnCerrarJornadaGlobal');
                    if(btn) {
                        btn.disabled = true;
                        btn.style.opacity = "0.5";
                        btn.style.cursor = "not-allowed";
                    }
                } else {
                    container.innerHTML = html;
                    const btn = document.getElementById('btnCerrarJornadaGlobal');
                    if(btn) {
                        btn.disabled = false;
                        btn.style.opacity = "1";
                        btn.style.cursor = "pointer";
                    }
                }

            } catch (error) {
                console.error("Error cargando checklist:", error);
                container.innerHTML = `<p style="color:red; text-align:center;">Error de conexión: ${error.message}</p>`;
            }
        }

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