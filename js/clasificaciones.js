/* Lógica para Clasificaciones CON TU ESTRUCTURA REAL (Nested Objects) */

// 1. IMPORTAR LIBRERÍAS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. TU CONFIGURACIÓN (Fantasy Atletismo 26)
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

// --- FUNCIÓN PRINCIPAL ---

async function cargarRanking(coleccionNombre, bodyId) {
    const tbody = document.getElementById(bodyId);
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#888;">Cargando...</td></tr>`;

    try {
        let q;
        
        // DIFERENCIA CLAVE: Si buscamos usuarios, ordenamos por el campo ANIDADO
        if (coleccionNombre === 'usuarios') {
            // Ordenamos por "equipo.puntos_totales"
            q = query(collection(db, coleccionNombre), orderBy("equipo.puntos_totales", "desc"));
        } else {
            // Para atletas asumimos que sigue siendo plano (nombre, puntos)
            // Si cambias la estructura de atletas, avísame
            q = query(collection(db, coleccionNombre), orderBy("puntos", "desc"));
        }

        const querySnapshot = await getDocs(q);
        tbody.innerHTML = "";

        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">No hay datos aún.</td></tr>`;
            return;
        }

        let index = 0;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            index++;

            // --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE ---
            let nombreMostrar = "Desconocido";
            let puntosMostrar = 0;

            if (coleccionNombre === 'usuarios') {
                // Entramos dentro del objeto 'equipo'
                if (data.equipo) {
                    nombreMostrar = data.equipo.nombre_usuario || "Sin Nombre";
                    puntosMostrar = data.equipo.puntos_totales || 0;
                }
            } else {
                // Para atletas (estructura simple)
                nombreMostrar = data.nombre;
                puntosMostrar = data.puntos;
            }

            // Crear fila HTML
            const tr = document.createElement('tr');
            
            // Medallas
            let rankDisplay = index;
            if(index === 1) rankDisplay = '<i class="fa-solid fa-medal medal-1"></i>';
            if(index === 2) rankDisplay = '<i class="fa-solid fa-medal medal-2"></i>';
            if(index === 3) rankDisplay = '<i class="fa-solid fa-medal medal-3"></i>';

            tr.innerHTML = `
                <td class="rank-col">${rankDisplay}</td>
                <td style="font-weight:600;">${nombreMostrar}</td>
                <td class="points-col">${puntosMostrar}</td>
            `;
            
            // Animación
            tr.style.opacity = "0";
            tr.style.animation = `slideIn 0.3s ease-out forwards ${index * 0.1}s`;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error cargando ranking:", error);
        // Si falla el ordenamiento (requiere índice en Firebase), prueba sin ordenar primero
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Error de conexión o falta índice.</td></tr>`;
    }
}

// --- ARRANQUE ---
document.addEventListener('DOMContentLoaded', () => {
    cargarRanking('usuarios', 'managersBody');
    cargarRanking('atletas', 'atletasBody');
});

// Estilos dinámicos
const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(styleSheet);