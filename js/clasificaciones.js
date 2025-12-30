import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TU CONFIGURACIÓN
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
        const querySnapshot = await getDocs(collection(db, coleccionNombre));
        let listaDatos = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let objetoLimpio = { nombre: "Desconocido", puntos: 0 };
            let esValido = false; // Solo añadiremos si encontramos datos reales

            if (coleccionNombre === 'usuarios') {
                // CASO 1: Estructura Completa (Admin/Mateo)
                // Verificamos que 'equipo' NO sea un array y tenga nombre_usuario
                if (data.equipo && !Array.isArray(data.equipo) && data.equipo.nombre_usuario) {
                    objetoLimpio.nombre = data.equipo.nombre_usuario;
                    objetoLimpio.puntos = data.equipo.puntos_totales || 0;
                    esValido = true;
                }
                // CASO 2: Estructura Antigua o Array Vacío
                // Si 'equipo' es [] (tu lista de atletas), buscamos el nombre fuera
                else if (data.nombre) {
                    objetoLimpio.nombre = data.nombre;
                    objetoLimpio.puntos = data.puntos || 0;
                    esValido = true;
                }
                // Si es un usuario "fantasma" sin nombre ni datos, lo ignoramos (esValido = false)
            } else {
                // ATLETAS
                objetoLimpio.nombre = data.nombre || data.nombre_atleta || "Atleta";
                objetoLimpio.puntos = data.puntos || 0;
                esValido = true;
            }
            
            if (esValido) {
                listaDatos.push(objetoLimpio);
            }
        });

        // Ordenar
        listaDatos.sort((a, b) => b.puntos - a.puntos);

        tbody.innerHTML = "";
        
        if (listaDatos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">Esperando managers...</td></tr>`;
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
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Error de conexión.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarRanking('usuarios', 'managersBody');
    cargarRanking('atletas', 'atletasBody');
});

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(styleSheet);