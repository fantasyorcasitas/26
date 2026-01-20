import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// Mantenemos getDocsFromServer para evitar problemas de caché viejos
import { getFirestore, collection, getDocsFromServer, doc, getDoc, getDocFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; 

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
                
                // Tomamos puntos reales (num) y truncamos más abajo si corresponde
                const puntosReales = Number(data.puntos_total) || 0; 

                // Reglas: se muestra siempre en ranking, pero solo recibe puntos si tiene 3+ jugadores y presupuesto >= 0
                const equipoLen = (data.equipo || []).length;
                const presupuesto = Number(data.presupuesto) || 0;

                // Los puntos solo se asignan si cumple el requisito de 3 jugadores y presupuesto válido
                const finalPuntos = (equipoLen >= 3 && presupuesto >= 0) ? Math.trunc(puntosReales) : 0;

                if (nombreReal) {
                    objetoLimpio.nombre = nombreReal;
                    objetoLimpio.puntos = Math.round(finalPuntos); // mostrar siempre enteros (redondeo)
                    objetoLimpio.id = doc.id; // guardamos el id del documento para poder abrir su equipo al clicar
                    objetoLimpio._equipoLen = equipoLen; // meta para debugging/uso futuro
                    objetoLimpio._presupuesto = presupuesto;
                    incluirEnTabla = true; // Siempre incluir en la tabla, aunque no tenga 3 jugadores
                }
            } else {
                // --- LÓGICA ATLETAS (CON APELLIDOS) ---
                const nombre = data.nombre || data.nombre_atleta || "Atleta";
                const apellidos = data.apellidos || ""; 
                
                // Juntamos Nombre + Apellido
                objetoLimpio.nombre = `${nombre} ${apellidos}`.trim(); 
                objetoLimpio.puntos = Math.round(Number(data.puntos) || 0); // mostrar sin decimales (enteros)
                
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
                    <td style="font-weight:600; font-size: 0.9rem;">${item.id ? `<span class="manager-name" data-id="${item.id}" style="cursor:pointer; color:inherit;">${item.nombre}</span>` : item.nombre}</td>
                    <td class="points-col" style="text-align:right; font-weight:800;">${item.puntos}</td>
                `;
                
                tr.style.opacity = "0";
                tr.style.animation = `slideIn 0.3s ease-out forwards ${index * 0.1}s`;
                tbody.appendChild(tr);

                // Hacer clicable el nombre para ver equipo (solo lectura) cuando el mercado esté cerrado
                const nameEl = tr.querySelector('.manager-name');
                if (nameEl) {
                    nameEl.onclick = (e) => {
                        e.stopPropagation();
                        if (!isMarketClosed()) {
                            alert('Solo disponible mientras tu equipo esté cerrado');
                            return;
                        }
                        showTeamModal(nameEl.dataset.id, nameEl.innerText);
                    }
                }
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

    const closeBtn = document.getElementById('closeTeamModal');
    if (closeBtn) closeBtn.onclick = () => { const m = document.getElementById('viewTeamModal'); if (m) m.style.display = 'none'; };
});

// Comprueba si el mercado (mi equipo) está cerrado — misma regla que en mi_equipo.js
function isMarketClosed() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    return (day === 6 || day === 0 || (day === 1 && hour < 8));
}

// Muestra modal con el equipo del manager (solo lectura)
async function showTeamModal(managerId, managerName) {
    const modal = document.getElementById('viewTeamModal');
    const content = document.getElementById('modalTeamContent');
    if (!modal || !content) return;

    modal.querySelector('.modal-manager-name').innerText = managerName;
    content.innerHTML = '<p style="color:#aaa;">Cargando...</p>';
    modal.style.display = 'flex';

    try {
        const userRef = doc(db, 'usuarios', managerId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) { content.innerHTML = '<p style="color:#ccc;">Usuario no encontrado</p>'; return; }

        const u = userSnap.data();
        const equipo = u.equipo || [];
        if (equipo.length === 0) { content.innerHTML = '<p style="color:#ccc;">Equipo vacío</p>'; return; }

        // Cargar atletas (si existen) — forzamos fetch desde servidor para evitar cache fuera de fecha
        const athletePromises = equipo.map(id => {
            const ref = doc(db, 'atletas', String(id).trim());
            // Intentamos servidor primero, en caso de fallo usamos getDoc (cache) como fallback
            return getDocFromServer(ref).then(s => s.exists() ? s.data() : null)
                .catch(e => {
                    console.warn('getDocFromServer fallo para', id, e);
                    return getDoc(ref).then(s => s.exists() ? s.data() : null);
                });
        });

        // Truncar precio al mostrar
        const truncatePrice = (v) => Math.trunc(Number(v) || 0);
        const athletes = await Promise.all(athletePromises);

        let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
        athletes.forEach(a => {
            if (!a) return;
            const foto = a.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png';
            html += `<div style="display:flex; gap:10px; align-items:center;">
                <img src="${foto}" style="width:44px;height:44px;border-radius:6px;object-fit:cover;">
                <div style="flex:1;">
                    <div style="font-weight:700;">${a.nombre} ${a.apellidos || ''}</div>
                    <div style="color:#ff5e00; font-size:0.85rem;">${truncatePrice(a.precio)}M | ${a.categoria || ''}</div>
                </div>
            </div>`;
        });
        html += '</div>';

        content.innerHTML = html;

    } catch (error) {
        console.error(error);
        content.innerHTML = '<p style="color:red;">Error cargando equipo.</p>';
    }
}

const styleSheet = document.createElement("style");
styleSheet.innerText = `@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
document.head.appendChild(styleSheet);