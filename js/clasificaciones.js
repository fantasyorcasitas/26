/* * Lógica para Clasificaciones CON TU FIREBASE REAL
 */

// 1. IMPORTAR LIBRERÍAS (Usamos las direcciones URL completas para que funcione en tu navegador)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. TU CONFIGURACIÓN DE FIREBASE (Fantasy Atletismo 26)
const firebaseConfig = {
  apiKey: "AIzaSyBmwfxAGq6dzy6RegYcWQHd4XgDgn1QJiM",
  authDomain: "fantasy-atletismo-26.firebaseapp.com",
  projectId: "fantasy-atletismo-26",
  storageBucket: "fantasy-atletismo-26.firebasestorage.app",
  messagingSenderId: "133833651406",
  appId: "1:133833651406:web:4e2841f58fd2a288c30c9f"
};

// 3. INICIALIZAR LA APP Y LA BASE DE DATOS
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- FUNCIONES ---

/**
 * Descarga datos de Firebase, los ordena y crea la tabla HTML.
 * @param {String} coleccionNombre - Nombre exacto de la colección en Firebase ('usuarios' o 'atletas')
 * @param {String} bodyId - ID del <tbody> en el HTML ('managersBody' o 'atletasBody')
 */
async function cargarRanking(coleccionNombre, bodyId) {
    const tbody = document.getElementById(bodyId);
    
    // Mensaje de carga inicial
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px; color:#888;">Cargando...</td></tr>`;

    try {
        // A. Hacemos la consulta: "Dame la colección, ordenada por 'puntos' de mayor a menor"
        const q = query(collection(db, coleccionNombre), orderBy("puntos", "desc"));
        const querySnapshot = await getDocs(q);
        
        // B. Limpiamos el mensaje de carga
        tbody.innerHTML = "";

        // C. Si no hay datos, avisamos
        if (querySnapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:20px;">No hay datos aún.</td></tr>`;
            return;
        }

        // D. Recorremos cada documento recibido
        let index = 0;
        querySnapshot.forEach((doc) => {
            const data = doc.data(); // Aquí están tus datos: { nombre: "...", puntos: 100 }
            index++;

            // Crear la fila
            const tr = document.createElement('tr');
            
            // Medallas para el Top 3
            let rankDisplay = index;
            if(index === 1) rankDisplay = '<i class="fa-solid fa-medal medal-1"></i>';
            if(index === 2) rankDisplay = '<i class="fa-solid fa-medal medal-2"></i>';
            if(index === 3) rankDisplay = '<i class="fa-solid fa-medal medal-3"></i>';

            // Insertar HTML
            // IMPORTANTE: Asegúrate de que en Firebase los campos se llamen "nombre" y "puntos"
            tr.innerHTML = `
                <td class="rank-col">${rankDisplay}</td>
                <td style="font-weight:600;">${data.nombre || "Desconocido"}</td>
                <td class="points-col">${data.puntos !== undefined ? data.puntos : 0}</td>
            `;
            
            // Animación de entrada
            tr.style.opacity = "0";
            tr.style.animation = `slideIn 0.3s ease-out forwards ${index * 0.1}s`;
            
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Error cargando ranking:", error);
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color:red;">Error de conexión.</td></tr>`;
    }
}

// --- ARRANQUE ---

// Cuando la página carga, llamamos a las funciones
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar tabla de Managers (Busca colección 'usuarios' en Firebase)
    cargarRanking('usuarios', 'managersBody');
    
    // 2. Cargar tabla de Atletas (Busca colección 'atletas' en Firebase)
    cargarRanking('atletas', 'atletasBody');
});

// Estilo dinámico para la animación
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);