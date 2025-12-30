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
    
    // Mensaje de carga limpio
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#888;">Cargando...</td></tr>`;

    try {
        // 1. Descargar datos
        const querySnapshot = await getDocs(collection(db, coleccionNombre));
        let listaDatos = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Datos leídos:", data); // Para que veas en la consola qué lee

            let objetoLimpio = { nombre: "---", puntos: 0 };

            // --- AQUÍ ESTÁ LA CLAVE PARA QUE SALGA TU NOMBRE ---
            if (coleccionNombre === 'usuarios') {
                // Si existe el campo 'equipo', entramos dentro
                if (data.equipo) {
                    objetoLimpio.nombre = data.equipo.nombre_usuario || "Usuario sin nombre";
                    objetoLimpio.puntos = data.equipo.puntos_totales || 0;
                } else {
                    // Si por algún casual el dato estuviera fuera (versiones viejas)
                    objetoLimpio.nombre = data.nombre || "Error Datos";
                }
            } else {
                // Para Atletas (estructura simple)
                objetoLimpio.nombre = data.nombre || data.nombre_atleta || "Atleta";
                objetoLimpio.puntos = data.puntos || 0;
            }
            
            listaDatos.push(objetoLimpio);
        });

        // 2. Ordenar de mayor a menor puntos
        listaDatos.sort((a, b) => b.puntos - a.puntos);

        // 3. Pintar tabla
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