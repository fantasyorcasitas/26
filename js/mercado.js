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

// --- 1. FUNCIÓN PRINCIPAL CARGAR MERCADO ---
async function cargarMercado() {
    const grid = document.getElementById('mercadoGrid');
    const inputBuscador = document.getElementById('buscadorAtleta');
    
    grid.innerHTML = '<p style="color:white;">Cargando atletas...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "atletas"));
        let atletas = [];

        querySnapshot.forEach((doc) => {
            let data = doc.data();
            data.id = doc.id; // Guardamos el ID por si acaso
            atletas.push(data);
        });

        // Ordenar por precio (Los más caros primero)
        atletas.sort((a, b) => b.precio - a.precio);

        // Renderizar
        renderizarAtletas(atletas, grid);

        // --- 2. FUNCIONALIDAD DEL BUSCADOR ---
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
        grid.innerHTML = '<p style="color:red;">Error al cargar datos.</p>';
    }
}

// --- 3. FUNCIÓN PARA DIBUJAR LAS TARJETAS ---
function renderizarAtletas(lista, contenedor) {
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="color:#aaa;">No se encontraron atletas.</p>';
        return;
    }

    lista.forEach(atleta => {
        // DATOS SIMULADOS (Hasta que la BD tenga historial real)
        // Simulamos 5 puntuaciones recientes
        const histPuntos = [
            Math.floor(Math.random() * 50),
            Math.floor(Math.random() * 50),
            Math.floor(Math.random() * 50),
            Math.floor(Math.random() * 50),
            atleta.puntos_ultima_jornada || 0 // El último es real si existe
        ];

        // Simulamos progresión de valor (Ej: 90M -> 91M -> 89M...)
        const precioBase = atleta.precio;
        const histValor = [
            precioBase - 2,
            precioBase - 1,
            precioBase + 1,
            precioBase,
            precioBase // El actual
        ];

        // Crear Tarjeta HTML
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
                    <span>Total Pts</span>
                    <strong>${atleta.puntos || 0}</strong>
                </div>
                <div class="stat-box">
                    <span>Últ. Jornada</span>
                    <strong>${atleta.puntos_ultima_jornada || 0}</strong>
                </div>
                <div class="stat-box">
                    <span>Media</span>
                    <strong>${((atleta.puntos || 0) / 5).toFixed(1)}</strong>
                </div>
            </div>

            <button class="btn-toggle-details" onclick="toggleDetails(this)">
                Ver estadísticas <i class="fa-solid fa-chevron-down"></i>
            </button>

            <div class="card-details">
                
                <div class="details-block">
                    <div class="details-title">Puntos últ. 5 Jornadas</div>
                    <div class="history-list">
                        ${histPuntos.map((pt, i) => `
                            <div class="history-item">
                                <span class="history-val">${pt}</span>
                                <span class="history-label">J${i+1}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="details-block" style="margin-bottom:0;">
                    <div class="details-title">Evolución Valor (M)</div>
                    <div class="history-list">
                        ${histValor.map((val, i) => {
                            // Calcular flecha
                            let icon = '<i class="fa-solid fa-minus trend-flat"></i>';
                            if(i > 0 && val > histValor[i-1]) icon = '<i class="fa-solid fa-arrow-trend-up trend-up"></i>';
                            if(i > 0 && val < histValor[i-1]) icon = '<i class="fa-solid fa-arrow-trend-down trend-down"></i>';
                            
                            return `
                                <div class="history-item">
                                    <span class="history-val" style="font-size:0.8rem;">${val}M</span>
                                    <span class="history-label">${icon}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

            </div>
        `;

        contenedor.appendChild(card);
    });
}

// Función global para el botón de acordeón
window.toggleDetails = function(btn) {
    const details = btn.nextElementSibling;
    const icon = btn.querySelector('i');
    
    if (details.style.display === "block") {
        details.style.display = "none";
        icon.className = "fa-solid fa-chevron-down";
        btn.innerHTML = 'Ver estadísticas <i class="fa-solid fa-chevron-down"></i>';
    } else {
        details.style.display = "block";
        icon.className = "fa-solid fa-chevron-up";
        btn.innerHTML = 'Ocultar <i class="fa-solid fa-chevron-up"></i>';
    }
};

// INICIAR
document.addEventListener('DOMContentLoaded', cargarMercado);