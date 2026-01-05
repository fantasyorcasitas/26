import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const mercadoGrid = document.getElementById('mercadoGrid');
const inputBuscador = document.getElementById('buscadorAtleta');
let todosLosAtletas = [];

// === 1. CARGAR MERCADO ===
async function cargarMercado() {
    try {
        mercadoGrid.innerHTML = '<p style="color:white; text-align:center">Cargando...</p>';
        const querySnapshot = await getDocs(collection(db, "atletas"));
        
        todosLosAtletas = [];
        querySnapshot.forEach((doc) => {
            todosLosAtletas.push({ id: doc.id, ...doc.data() });
        });

        renderizarAtletas(todosLosAtletas);
    } catch (error) {
        console.error("Error:", error);
        mercadoGrid.innerHTML = '<p style="color:red; text-align:center">Error cargando datos.</p>';
    }
}

// === 2. RENDERIZAR TARJETAS (DISEÑO ANTIGUO + GRÁFICAS OCULTAS) ===
function renderizarAtletas(listaAtletas) {
    if (listaAtletas.length === 0) {
        mercadoGrid.innerHTML = '<p style="text-align:center; color:gray">No hay resultados.</p>';
        return;
    }

    let htmlAcumulado = '';

    listaAtletas.forEach(atleta => {
        // --- CÁLCULOS DE ESTADÍSTICAS (TOTAL, MEDIA, ÚLTIMA) ---
        const historial = atleta.historial_puntos || [];
        const totalPuntos = historial.reduce((a, b) => a + b, 0);
        const ultimaJornada = historial.length > 0 ? historial[historial.length - 1] : 0;
        const media = historial.length > 0 ? (totalPuntos / historial.length).toFixed(1) : "0.0";
        
        // Precio formateado (Ej: 28M)
        const precioDisplay = (atleta.precio / 1000000).toFixed(0) + 'M';

        // --- PREPARAR GRÁFICAS (OCULTAS POR DEFECTO) ---
        // Puntos
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

        // Valor
        const valorVisuales = prepararUltimos5(atleta.historial_valor || [atleta.precio], true);
        let htmlGridValor = '';
        valorVisuales.forEach((val, i) => {
            htmlGridValor += `
                <div class="grid-item">
                    <span class="grid-label">Reg-${i+1}</span>
                    <span class="grid-value">${val}</span>
                </div>`;
        });

        // --- HTML DE LA TARJETA ---
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
// Función para abrir/cerrar el acordeón
window.toggleHistorial = (id) => {
    const el = document.getElementById(`historial-${id}`);
    if (el.style.display === "none") {
        el.style.display = "block";
    } else {
        el.style.display = "none";
    }
};

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
            resultado[index + offset] = (dato / 1000000).toFixed(1) + 'M';
        } else {
            resultado[index + offset] = dato;
        }
    });
    return resultado;
}