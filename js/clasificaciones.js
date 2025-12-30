import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TU CONFIGURACIÓN (Fantasy Atletismo 26)
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
        // 1. Traemos TODOS los documentos de la colección
        const querySnapshot = await getDocs(collection(db, coleccionNombre));
        
        let listaDatos = [];

        // 2. Procesamos los datos para sacar lo que nos interesa
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            let objetoLimpio = { nombre: "Desconocido", puntos: 0 };

            if (coleccionNombre === 'usuarios') {
                // LÓGICA ESPECÍFICA PARA TU ESTRUCTURA "EQUIPO"
                if (data.equipo) {
                    objetoLimpio.nombre = data.equipo.nombre_usuario || "Sin Nombre";
                    objetoLimpio.puntos = data.equipo.puntos_totales || 0;
                }
            } else {
                // Para atletas (si la estructura es simple)
                objetoLimpio.nombre = data.nombre || data.nombre_atleta || "Atleta";
                objetoLimpio.puntos = data.puntos || 0;
            }
            
            listaDatos.push(objetoLimpio);
        });

        // 3. Ordenamos nosotros mismos (Mayor a menor puntos)
        listaDatos.sort((a, b) => b.puntos - a.puntos);

        // 4. Pintamos la tabla
        tbody.innerHTML = "";
        
        if (listaDatos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">No hay datos.</td></tr>`;
            return;
        }

        listaDatos.forEach((item, index) => {
            const tr = document.createElement('tr');
            
            // Medallas
            let rankDisplay = index + 1;
            if(index === 0) rankDisplay = '<i class="fa-solid fa-medal medal-1"></i>';
            if(index === 1) rankDisplay = '<i class="fa-solid fa-medal medal-2"></i>';
            if(index === 2) rankDisplay = '<i class="fa-solid fa-medal medal-3"></i>';

            tr.innerHTML = `
                <td class="rank-col">${rankDisplay}</td>
                <td style="font-weight:600;">${item.nombre}</td>
                <td class="points-col">${item.puntos}</td>
            `;
            
            // Animación
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