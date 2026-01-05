import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const mercadoGrid = document.getElementById('mercadoGrid');
const inputBuscador = document.getElementById('buscadorAtleta');
let todosLosAtletas = [];

// === 1. CARGAR MERCADO Y ORDENAR ===
async function cargarMercado() {
    try {
        mercadoGrid.innerHTML = '<p style="color:white; text-align:center">Cargando...</p>';
        const querySnapshot = await getDocs(collection(db, "atletas"));
        
        todosLosAtletas = [];
        querySnapshot.forEach((doc) => {
            todosLosAtletas.push({ id: doc.id, ...doc.data() });
        });

        // ORDENAR POR PRECIO (DE MAYOR A MENOR)
        todosLosAtletas.sort((a, b) => Number(b.precio) - Number(a.precio));

        renderizarAtletas(todosLosAtletas);
    } catch (error) {
        console.error("Error:", error);
        mercadoGrid.innerHTML = '<p style="color:red; text-align:center">Error cargando datos.</p>';
    }
}

// === 2. RENDERIZAR TARJETAS ===
function renderizarAtletas(listaAtletas) {
    if (listaAtletas.length === 0) {
        mercadoGrid.innerHTML = '<p style="text-align:center; color:gray">No hay resultados.</p>';
        return;
    }

    let htmlAcumulado = '';

    listaAtletas.forEach(atleta => {
        // --- A. CÁLCULOS DE ESTADÍSTICAS ---
        const historial = atleta.historial_puntos || [];
        const totalPuntos = historial.reduce((a, b) => a + b, 0);
        const ultimaJornada = historial.length > 0 ? historial[historial.length - 1] : 0;
        const media = historial.length > 0 ? (totalPuntos / historial.length).toFixed(1) : "0.0";
        
        // PRECIO DIRECTO (Ej: "7M")
        const precioVal = atleta.precio !== undefined ? atleta.precio : 0;
        const precioDisplay = precioVal + 'M';

        // --- B. PREPARAR GRÁFICAS (OCULTAS) ---
        const puntosVisuales = prepararUltimos5(historial, false);
        const labelsPuntos = ['J-4', 'J-3', 'J-2', 'J-1', 'ÚLTIMA'];
        let htmlGridPuntos = '';
        puntosVisuales.forEach((val, i) => {
            htmlGridPuntos += `
                <div class="grid-item">
                    <span class="grid-label">${labelsPuntos[i]}</span>
                    <span class="grid-value">${val}</span>
                </div>`;
        });

        const valorVisuales = prepararUltimos5(atleta.historial_valor || [precioVal], true);
        let htmlGridValor = '';
        valorVisuales.forEach((val, i) => {
            htmlGridValor += `
                <div class="grid-item">
                    <span class="grid-label">Reg-${i+1}</span>
                    <span class="grid-value">${val}</span>
                </div>`;
        });

        // --- C. CONSTRUIR HTML ---
        htmlAcumulado += `
            <div class="athlete-card">
                <div class="athlete-header">
                    <img src="${atleta.foto}" class="athlete-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/74/74472.png'">
                    <div class="athlete-info">
                        <h3>${atleta.nombre} ${atleta.apellidos || ''}</h3>
                        <span class="badge-cat">${atleta.categoria || 'JUGADOR'}</span>
                        <div class="price-tag">${precioDisplay}</div>
                    </div>
                </div>

                <div class="stats-summary">
                    <div class="stat-box">
                        <span class="stat-label">TOTAL</span>
                        <span class="stat-num">${totalPuntos}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">ÚLTIMA</span>
                        <span class="stat-num">${ultimaJornada}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">MEDIA</span>
                        <span class="stat-num">${media}</span>
                    </div>
                </div>

                <div class="toggle-btn" onclick="toggleHistorial('${atleta.id}')">
                    Ver historial <i class="fa-solid fa-list-ul"></i>
                </div>

                <div id="historial-${atleta.id}" class="historial-desplegable" style="display: none;">
                    <div class="stats-section">
                        <label class="section-label">Puntos (Últimas 5)</label>
                        <div class="history-grid">${htmlGridPuntos}</div>
                    </div>
                    <div class="stats-section">
                        <label class="section-label">Evolución Valor</label>
                        <div class="history-grid">${htmlGridValor}</div>
                    </div>
                    </div>
            </div>
        `;
    });

    mercadoGrid.innerHTML = htmlAcumulado;
}

// === 3. FUNCIONES AUXILIARES ===
window.toggleHistorial = (id) => {
    const el = document.getElementById(`historial-${id}`);
    const btn = event.currentTarget; 
    
    if (el.style.display === "none") {
        el.style.display = "block";
        btn.innerHTML = 'Ocultar <i class="fa-solid fa-chevron-up"></i>';
    } else {
        el.style.display = "none";
        btn.innerHTML = 'Ver historial <i class="fa-solid fa-list-ul"></i>';
    }
};

// La función window.ficharAtleta ya no es necesaria, pero no molesta si la dejas.

inputBuscador.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const filtrados = todosLosAtletas.filter(a => (a.nombre + ' ' + a.apellidos).toLowerCase().includes(texto));
    renderizarAtletas(filtrados);
});

window.addEventListener('DOMContentLoaded', cargarMercado);

function prepararUltimos5(arrayDatos, esMoneda = false) {
    const datos = arrayDatos || [];
    const ultimos = datos.slice(-5);
    const resultado = Array(5).fill('-');
    const offset = 5 - ultimos.length;
    
    ultimos.forEach((dato, index) => {
        if (esMoneda) {
            resultado[index + offset] = dato + 'M'; 
        } else {
            resultado[index + offset] = dato;
        }
    });
    return resultado;
}