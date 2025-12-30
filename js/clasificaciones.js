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
            let objetoLimpio = { nombre: "---", puntos: 0 };

            console.log(`🔎 Analizando doc (${doc.id}):`, data); // Mira la consola (F12)

            if (coleccionNombre === 'usuarios') {
                // ESTRATEGIA FUERZA BRUTA: Buscar el nombre donde sea
                
                // 1. ¿Está dentro de 'equipo'?
                if (data.equipo) {
                    // Intenta leer el nombre exacto
                    let nombre = data.equipo.nombre_usuario;
                    let puntos = data.equipo.puntos_totales;

                    // Si falla, ¿quizás el campo tiene un espacio? (Ej: "nombre_usuario ")
                    if (!nombre) {
                        // Buscamos cualquier clave que se parezca a 'nombre'
                        const keys = Object.keys(data.equipo);
                        const keyNombre = keys.find(k => k.includes("nombre")); 
                        if (keyNombre) nombre = data.equipo[keyNombre];
                    }

                    if (nombre) {
                        objetoLimpio.nombre = nombre;
                        objetoLimpio.puntos = puntos || 0;
                    } else {
                        // Si data.equipo existe pero no tiene nombre, muéstrame qué tiene dentro
                        objetoLimpio.nombre = "DATA: " + JSON.stringify(data.equipo);
                        objetoLimpio.puntos = 0;
                    }
                } 
                // 2. ¿Está fuera (en la raíz)?
                else if (data.nombre) {
                    objetoLimpio.nombre = data.nombre;
                    objetoLimpio.puntos = data.puntos || 0;
                }
                // 3. Fallo total: Muéstrame todo lo que hay
                else {
                    objetoLimpio.nombre = "RAW: " + JSON.stringify(data); 
                }
            } else {
                // LOGICA ATLETAS
                objetoLimpio.nombre = data.nombre || data.nombre_atleta || "Atleta";
                objetoLimpio.puntos = data.puntos || 0;
            }
            
            listaDatos.push(objetoLimpio);
        });

        // Ordenar
        listaDatos.sort((a, b) => b.puntos - a.puntos);

        tbody.innerHTML = "";
        
        if (listaDatos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">No hay datos.</td></tr>`;
            return;
        }

        listaDatos.forEach((item, index) => {
            const tr = document.createElement('tr');
            
            let rankDisplay = index + 1;
            if(index === 0) rankDisplay = '<i class="fa-solid fa-medal medal-1"></i> ';
            if(index === 1) rankDisplay = '<i class="fa-solid fa-medal medal-2"></i> ';
            if(index === 2) rankDisplay = '<i class="fa-solid fa-medal medal-3"></i> ';

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
        console.error("Error cargando ranking:", error);
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