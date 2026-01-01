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

// --- CARGAR MERCADO ---
async function cargarMercado() {
    const grid = document.getElementById('mercadoGrid');
    const inputBuscador = document.getElementById('buscadorAtleta');
    
    grid.innerHTML = '<p style="color:white; text-align:center;">Cargando atletas...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "atletas"));
        let atletas = [];

        querySnapshot.forEach((doc) => {
            let data = doc.data();
            data.id = doc.id;
            atletas.push(data);
        });

        // Ordenar por precio (Los más caros primero)
        atletas.sort((a, b) => b.precio - a.precio);
        renderizarAtletas(atletas, grid);

        // Buscador
        inputBuscador.addEventListener('keyup', (e) => {
            const termino = e.target.value.toLowerCase();
            const filtrados = atletas.filter(atleta => 
                atleta.nombre.toLowerCase().includes(termino) || 
                atleta.apellidos.toLowerCase().includes(termino)
            );
            renderizarAtletas(filtrados, grid);
        });

    } catch (error) {
        console.error("Error mercado:", error);
        grid.innerHTML = '<p style="color:red; text-align:center;">Error al cargar datos.</p>';
    }
}

// --- RENDERIZAR TARJETAS (VERSIÓN TEXTO SIMPLE) ---
function renderizarAtletas(lista, contenedor) {
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="color:#aaa; text-align:center;">No se encontraron atletas.</p>';
        return;
    }

    lista.forEach(atleta => {
        
        // 1. PUNTOS REALES (Sin aleatorios)
        // Como no hay jornadas, ponemos 0 o guiones
        const ptsTotal = atleta.puntos || 0;
        const ptsUltima = atleta.puntos_ultima_jornada || 0;
        const media = (ptsTotal > 0) ? (ptsTotal / 1).toFixed(1) : "0.0"; // Ajustar divisor cuando haya jornadas

        // 2. HTML PARA LISTA DE PUNTOS RECIENTES
        // Mostramos marcadores vacíos "-" ya que no hay historial
        const htmlPuntos = `
            <div class="points-row">
                <div class="point-item"><span class="point-val">-</span><span class="point-label">J-4</span></div>
                <div class="point-item"><span class="point-val">-</span><span class="point-label">J-3</span></div>
                <div class="point-item"><span class="point-val">-</span><span class="point-label">J-2</span></div>
                <div class="point-item"><span class="point-val">-</span><span class="point-label">J-1</span></div>
                <div class="point-item"><span class="point-val" style="color:#ffae00;">${ptsUltima}</span><span class="point-label">Última</span></div>
            </div>
        `;

        // 3. HTML PARA HISTORIAL DE VALOR
        // Mostramos el valor actual como "Inicio" y "Actual"
        const htmlValor = `
            <ul class="value-list">
                <li class="value-item">
                    <span>Valor Inicial</span>
                    <span class="value-price" style="color:#888;">${atleta.precio}M</span>
                </li>
                <li class="value-item">
                    <span>Valor Actual</span>
                    <span class="value-price">${atleta.precio}M <i class="fa-solid fa-minus" style="font-size:0.7rem; color:#888; margin-left:5px;"></i></span>
                </li>
            </ul>
        `;

        // CREAR TARJETA
        const card = document.createElement('div');
        card.className = 'athlete-card';

        card.innerHTML = `
            <div class="card-header-flex">
                <img src="${atleta.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png'}" alt="Foto" class="card-img">
                <div class="card-basic-info">
                    <h3>${atleta.nombre} ${atleta.apellidos}</h3>
                    <span class="card-category-badge">${atleta.categoria}</span>
                    <p style="color: #4cd137; font-weight:bold; font-size: 1rem; margin-top:5px;">
                        ${atleta.precio}M
                    </p>
                </div>
            </div>

            <div class="card-main-stats">
                <div class="stat-box">
                    <span>Total</span>
                    <strong>${ptsTotal}</strong>
                </div>
                <div class="stat-box">
                    <span>Última</span>
                    <strong>${ptsUltima}</strong>
                </div>
                <div class="stat-box">
                    <span>Media</span>
                    <strong>${media}</strong>
                </div>
            </div>

            <button class="btn-toggle-details" onclick="toggleDetails(this)">
                Ver historial <i class="fa-solid fa-list-ul"></i>
            </button>

            <div class="card-details">
                
                <div class="details-block">
                    <div class="details-title">Puntos por Jornada</div>
                    ${htmlPuntos}
                </div>

                <div class="details-block" style="margin-bottom:0;">
                    <div class="details-title">Histórico de Valor</div>
                    ${htmlValor}
                </div>

            </div>
        `;

        contenedor.appendChild(card);
    });
}

// GLOBAL: Acordeón
window.toggleDetails = function(btn) {
    const details = btn.nextElementSibling;
    if (details.style.display === "block") {
        details.style.display = "none";
        btn.innerHTML = 'Ver historial <i class="fa-solid fa-list-ul"></i>';
    } else {
        details.style.display = "block";
        btn.innerHTML = 'Ocultar <i class="fa-solid fa-chevron-up"></i>';
    }
};

document.addEventListener('DOMContentLoaded', cargarMercado);