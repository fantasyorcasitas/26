 import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Variables globales
const mercadoGrid = document.getElementById('mercadoGrid');
const inputBuscador = document.getElementById('buscadorAtleta');
let todosLosAtletas = []; // Aquí guardaremos los datos para no recargar Firebase al buscar

// === 1. FUNCIÓN PRINCIPAL: CARGAR MERCADO ===
async function cargarMercado() {
    try {
        mercadoGrid.innerHTML = '<p style="color:white; text-align:center">Cargando mercado...</p>';

        // Obtenemos la colección "atletas"
        const querySnapshot = await getDocs(collection(db, "atletas"));
        
        todosLosAtletas = []; // Limpiamos array

        querySnapshot.forEach((doc) => {
            // Guardamos los datos y el ID
            todosLosAtletas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Una vez cargados, los mostramos
        renderizarAtletas(todosLosAtletas);

    } catch (error) {
        console.error("Error cargando mercado:", error);
        mercadoGrid.innerHTML = '<p style="color:red; text-align:center">Error cargando datos.</p>';
    }
}

// === 2. FUNCIÓN DE RENDERIZADO (PINTAR TARJETAS) ===
function renderizarAtletas(listaAtletas) {
    // Si no hay nadie (por búsqueda)
    if (listaAtletas.length === 0) {
        mercadoGrid.innerHTML = '<p style="color:gray; text-align:center">No se encontraron atletas.</p>';
        return;
    }

    let htmlAcumulado = '';

    listaAtletas.forEach(atleta => {
        
        // --- AQUÍ ESTÁ LA LÓGICA DE LAS 5 COLUMNAS ---
        
        // 1. Preparamos PUNTOS (J-4 ... Última)
        // Si no tiene historial, pasamos array vacío
        const puntosVisuales = prepararUltimos5(atleta.historial_puntos || [], false);
        const labelsPuntos = ['J-4', 'J-3', 'J-2', 'J-1', 'ÚLTIMA'];
        
        let htmlGridPuntos = '';
        puntosVisuales.forEach((valor, i) => {
            htmlGridPuntos += `
                <div class="grid-item">
                    <span class="grid-label">${labelsPuntos[i]}</span>
                    <span class="grid-value">${valor}</span>
                </div>
            `;
        });

        // 2. Preparamos VALOR (Reg-1 ... Reg-5)
        // Si no tiene historial, usamos su precio actual como único dato
        const historialValor = atleta.historial_valor || [atleta.precio];
        const valorVisuales = prepararUltimos5(historialValor, true);
        
        let htmlGridValor = '';
        valorVisuales.forEach((valor, i) => {
            // Lógica visual: Si no es un guión, pintamos en blanco (o verde/rojo si quisieras calcular cambios)
            htmlGridValor += `
                <div class="grid-item">
                    <span class="grid-label">Reg-${i+1}</span>
                    <span class="grid-value">${valor}</span>
                </div>
            `;
        });

        // 3. Construimos la TARJETA
        const precioFormateado = (atleta.precio / 1000000).toFixed(1) + 'M';
        
        htmlAcumulado += `
            <div class="athlete-card">
                <div class="athlete-header">
                    <img src="${atleta.foto}" alt="${atleta.nombre}" class="athlete-img" onerror="this.src='https://cdn-icons-png.flaticon.com/512/74/74472.png'">
                    <div>
                        <h3>${atleta.nombre} ${atleta.apellidos || ''}</h3>
                        <p class="athlete-pos">${atleta.categoria || 'Jugador'}</p>
                    </div>
                </div>

                <div class="stats-section">
                    <label class="section-label">Puntos (Últimas 5 Jornadas)</label>
                    <div class="history-grid">
                        ${htmlGridPuntos}
                    </div>
                </div>
                
                <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 8px 0;">

                <div class="stats-section">
                    <label class="section-label">Evolución de Valor</label>
                    <div class="history-grid">
                        ${htmlGridValor}
                    </div>
                </div>

                <button class="btn-comprar" onclick="ficharAtleta('${atleta.id}', '${atleta.nombre}', ${atleta.precio})">
                    Fichar (${precioFormateado})
                </button>
            </div>
        `;
    });

    mercadoGrid.innerHTML = htmlAcumulado;
}

// === 3. LÓGICA DEL BUSCADOR ===
inputBuscador.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    
    // Filtramos el array global
    const filtrados = todosLosAtletas.filter(atleta => {
        const nombreCompleto = `${atleta.nombre} ${atleta.apellidos || ''}`.toLowerCase();
        return nombreCompleto.includes(texto);
    });

    renderizarAtletas(filtrados);
});

// === 4. FUNCIÓN TEMPORAL PARA FICHAR ===
// Necesitamos ponerla en window para que el onclick del HTML funcione
window.ficharAtleta = (id, nombre, precio) => {
    // Aquí iría la lógica de comprobar dinero del usuario, restar saldo, etc.
    alert(`Has solicitado fichar a ${nombre} por ${(precio/1000000).toFixed(1)}M.\n\n(Lógica de compra pendiente de implementar)`);
};

// === 5. INICIALIZACIÓN ===
window.addEventListener('DOMContentLoaded', cargarMercado);


// ======================================================
// === FUNCIÓN AUXILIAR (LA MAGIA DE LAS 5 COLUMNAS) ===
// ======================================================
function prepararUltimos5(arrayDatos, esMoneda = false) {
    const datos = arrayDatos || [];
    // Tomamos solo los últimos 5 datos reales
    const ultimos = datos.slice(-5);
    
    // Creamos un array de 5 huecos llenos de guiones
    const resultado = Array(5).fill('-');
    
    // Calculamos dónde empezar a rellenar (alineado a la derecha)
    const offset = 5 - ultimos.length;
    
    ultimos.forEach((dato, index) => {
        if (esMoneda) {
            // Convierte 56000000 -> 56.0M
            resultado[index + offset] = (dato / 1000000).toFixed(1) + 'M';
        } else {
            resultado[index + offset] = dato;
        }
    });
    
    return resultado;
}