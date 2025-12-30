/* js/clasificaciones.js */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
            let objetoLimpio = { nombre: "---", puntos: 0 };

            if (coleccionNombre === 'usuarios') {
                // ESTRUCTURA CON 'EQUIPO'
                if (data.equipo) {
                    // Intento 1: Leer el nombre normal
                    let nombreLeido = data.equipo.nombre_usuario;
                    
                    // MODO RAYOS X: Si no lo encuentra, muéstrame QUÉ HAY dentro de 'equipo'
                    if (!nombreLeido) {
                        // Esto imprimirá algo como: {"nombre_usuario ": "Mateo"} (fíjate en los espacios)
                        nombreLeido = "DEBUG: " + JSON.stringify(data.equipo).substring(0, 40);
                    }
                    
                    objetoLimpio.nombre = nombreLeido;
                    objetoLimpio.puntos = data.equipo.puntos_totales || 0;
                } else {
                    // Si no tiene carpeta equipo (versión plana)
                    objetoLimpio.nombre = data.nombre || "Sin carpeta equipo";
                    objetoLimpio.puntos = data.puntos || 0;
                }
            } else {
                // ATLETAS
                objetoLimpio.nombre = data.nombre || data.nombre_atleta || "Atleta";
                objetoLimpio.puntos = data.puntos || 0;
            }
            
            listaDatos.push(objetoLimpio);
        });

        // Ordenar
        listaDatos.sort((a, b) => b.puntos - a.puntos);

        // Pintar
        tbody.innerHTML = "";
        
        if (listaDatos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">No hay datos.</td></tr>`;
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