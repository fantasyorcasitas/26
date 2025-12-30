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
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#888;">Cargando...</td></tr>`;

    try {
        // Forzamos la descarga real de datos
        const querySnapshot = await getDocsFromServer(collection(db, coleccionNombre));
        let listaDatos = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let objetoLimpio = { nombre: "---", puntos: 0 };
            let incluirEnTabla = false;

            if (coleccionNombre === 'usuarios') {
                // --- CORRECCIÓN DEFINITIVA SEGÚN TU ÚLTIMA FOTO ---
                // Los datos están en la raíz, NO dentro de 'equipo'
                
                // Buscamos 'nombre_usuario' (Tu estructura nueva) O 'nombre' (Posible estructura vieja)
                const nombreReal = data.nombre_usuario || data.nombre;
                const puntosReales = data.puntos_totales || data.puntos || 0;

                if (nombreReal) {
                    objetoLimpio.nombre = nombreReal;
                    objetoLimpio.puntos = puntosReales;
                    incluirEnTabla = true;
                }
            } else {
                // ATLETAS
                if (data.nombre || data.nombre_atleta) {
                    objetoLimpio.nombre = data.nombre || data.nombre_atleta;
                    objetoLimpio.puntos = data.puntos || 0;
                    incluirEnTabla = true;
                }
            }
            
            if (incluirEnTabla) {
                listaDatos.push(objetoLimpio);
            }
        });

        // Ordenar de Mayor a Menor
        listaDatos.sort((a, b) => b.puntos - a.puntos);

        tbody.innerHTML = "";
        
        if (listaDatos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">Esperando datos...</td></tr>`;
            return;
        }

        listaDatos.forEach((item, index) => {
            const tr = document.createElement('tr');
            
            let rankDisplay = index + 1;
            if(index === 0) rankDisplay = '<i class="fa-solid fa-medal medal-1"></i>';
            if(index === 1) rankDisplay = '<i class="fa-solid fa-medal medal-2"></i>';
            if(index === 2) rankDisplay = '<i class="fa-solid fa-medal medal-3"></i>';

            tr.innerHTML = `
                <td class="rank-col">${rankDisplay}</td>
                <td style="font-weight:600; font-size: 0.9rem;">${item.nombre}</td>
                <td class="points-col">${item.puntos}</td>
            `;
            
            tr.style.opacity = "0";
            tr.style.animation = `slideIn 0.3s ease-out forwards ${index * 0.1}s`;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Error conexión.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarRanking('usuarios', 'managersBody');
    cargarRanking('atletas', 'atletasBody');
});

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(styleSheet);