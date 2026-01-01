import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// Mantenemos getDocsFromServer para evitar problemas de caché viejos
import { getFirestore, collection, getDocsFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmwfxAGq6dzy6RegYcWQHd4XgDgn1QJiM",
  authDomain: "fantasy-atletismo-26.firebaseapp.com",
  projectId: "fantasy-atletismo-26",
  storageBucket: "fantasy-atletismo-26.firebasestorage.app",
  messagingSenderId: "133833651406",
  appId: "1:133833651406:web:4e2841f58fd2a288c30c9f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cargarRanking(coleccionNombre, bodyId) {
    const tbody = document.getElementById(bodyId);
    if(tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#888;">Cargando...</td></tr>`;

    try {
        // Forzamos la descarga real de datos
        const querySnapshot = await getDocsFromServer(collection(db, coleccionNombre));
        let listaDatos = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let objetoLimpio = { nombre: "---", puntos: 0 };
            let incluirEnTabla = false;

            if (coleccionNombre === 'usuarios') {
                // --- LÓGICA MANAGERS (USUARIOS) ---
                // Buscamos 'nick', 'nombre_usuario' o 'nombre'
                const nombreReal = data.nick || data.nombre_usuario || data.nombre || "Manager";
                
                // *** CORRECCIÓN AQUÍ: puntos_total (singular) ***
                const puntosReales = data.puntos_total || 0; 

                if (nombreReal) {
                    objetoLimpio.nombre = nombreReal;
                    objetoLimpio.puntos = puntosReales;
                    incluirEnTabla = true;
                }
            } else {
                // --- LÓGICA ATLETAS (CON APELLIDOS) ---
                const nombre = data.nombre || data.nombre_atleta || "Atleta";
                const apellidos = data.apellidos || ""; 
                
                // Juntamos Nombre + Apellido
                objetoLimpio.nombre = `${nombre} ${apellidos}`.trim(); 
                objetoLimpio.puntos = data.puntos || 0;
                
                // Incluimos en la tabla si tiene nombre válido
                if (objetoLimpio.nombre !== "Atleta" && objetoLimpio.nombre !== "") {
                     incluirEnTabla = true;
                }
            }
            
            if (incluirEnTabla) {
                listaDatos.push(objetoLimpio);
            }
        });

        // Ordenar de Mayor a Menor
        listaDatos.sort((a, b) => b.puntos - a.puntos);

        if(tbody) {
            tbody.innerHTML = "";
            
            if (listaDatos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">Esperando datos...</td></tr>`;
                return;
            }

            listaDatos.forEach((item, index) => {
                const tr = document.createElement('tr');
                
                let rankDisplay = index + 1;
                if(index === 0) rankDisplay = '<i class="fa-solid fa-medal medal-1" style="color:#ffd700;"></i>';
                if(index === 1) rankDisplay = '<i class="fa-solid fa-medal medal-2" style="color:#c0c0c0;"></i>';
                if(index === 2) rankDisplay = '<i class="fa-solid fa-medal medal-3" style="color:#cd7f32;"></i>';

                tr.innerHTML = `
                    <td class="rank-col" style="text-align:center;">${rankDisplay}</td>
                    <td style="font-weight:600; font-size: 0.9rem;">${item.nombre}</td>
                    <td class="points-col" style="text-align:right; font-weight:800;">${item.puntos}</td>
                `;
                
                tr.style.opacity = "0";
                tr.style.animation = `slideIn 0.3s ease-out forwards ${index * 0.1}s`;
                tbody.appendChild(tr);
            });
        }

    } catch (error) {
        console.error("Error:", error);
        if(tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Error conexión.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarRanking('usuarios', 'managersBody');
    cargarRanking('atletas', 'atletasBody');
});

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(styleSheet);