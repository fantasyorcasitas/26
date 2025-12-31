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

        atletas.sort((a, b) => b.precio - a.precio);
        renderizarAtletas(atletas, grid);

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

// --- RENDERIZAR TARJETAS ---
function renderizarAtletas(lista, contenedor) {
    contenedor.innerHTML = "";

    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="color:#aaa; text-align:center;">No se encontraron atletas.</p>';
        return;
    }

    lista.forEach(atleta => {
        // 1. DATOS SIMULADOS (PUNTOS)
        // Usamos datos aleatorios si no hay histórico real
        const histPuntos = [
            Math.floor(Math.random() * 40) + 10,
            Math.floor(Math.random() * 40) + 10,
            Math.floor(Math.random() * 40) + 10,
            Math.floor(Math.random() * 40) + 10,
            atleta.puntos_ultima_jornada || Math.floor(Math.random() * 40)
        ];

        // 2. DATOS SIMULADOS (PRECIO)
        const p = atleta.precio;
        const histValor = [ p - 2, p - 3, p - 1, p + 1, p ]; // Simulación de curva

        // --- GENERADOR DE GRÁFICO DE BARRAS (HTML) ---
        // Buscamos el valor máximo para calcular el 100% de altura (ej: si el max es 50pts)
        const maxPuntosChart = Math.max(...histPuntos, 50); 
        
        const barrasHTML = histPuntos.map((pt, i) => {
            // Regla de tres: Si maxPuntosChart es 100%, pt es X%
            let altura = (pt / maxPuntosChart) * 100;
            if (altura < 20) altura = 20; // Mínimo para que quepa el número
            
            return `
                <div class="bar-wrapper">
                    <div class="bar" style="height: ${altura}%;">
                        <span>${pt}</span>
                    </div>
                    <div class="bar-label">J${i+1}</div>
                </div>
            `;
        }).join('');

        // --- GENERADOR DE GRÁFICO DE LÍNEA (SVG) ---
        const svgHTML = generarGraficoLinea(histValor);


        // --- CREAR TARJETA ---
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
                    <strong>${atleta.puntos || 0}</strong>
                </div>
                <div class="stat-box">
                    <span>Última</span>
                    <strong>${atleta.puntos_ultima_jornada || 0}</strong>
                </div>
                <div class="stat-box">
                    <span>Media</span>
                    <strong>${((atleta.puntos || 0)/5).toFixed(1)}</strong>
                </div>
            </div>

            <button class="btn-toggle-details" onclick="toggleDetails(this)">
                Ver análisis <i class="fa-solid fa-chart-simple"></i>
            </button>

            <div class="card-details">
                
                <div class="details-block">
                    <div class="details-title">Rendimiento (Últ. 5)</div>
                    <div class="chart-bar-container">
                        ${barrasHTML}
                    </div>
                </div>

                <div class="details-block" style="margin-bottom:0;">
                    <div class="details-title">Evolución Valor</div>
                    <div class="chart-line-container">
                        ${svgHTML}
                    </div>
                </div>

            </div>
        `;

        contenedor.appendChild(card);
    });
}

// --- FUNCIÓN MATEMÁTICA PARA EL SVG DE PRECIOS ---
function generarGraficoLinea(datos) {
    const width = 100; // Unidades SVG (porcentaje relativo)
    const height = 100;
    
    // Encontrar min y max para escalar el gráfico verticalmente
    const minVal = Math.min(...datos) - 1; // Un poco de margen abajo
    const maxVal = Math.max(...datos) + 1; // Un poco de margen arriba
    const range = maxVal - minVal;

    // Calcular coordenadas (x, y)
    // X va de 10 a 90 para dejar margen a los lados
    const points = datos.map((val, i) => {
        const x = (i / (datos.length - 1)) * 80 + 10; 
        // Y se invierte porque en SVG 0 es arriba y 100 abajo
        const y = 100 - ((val - minVal) / range) * 80 - 10; 
        return { x, y, val };
    });

    // Crear la línea polilínea
    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

    // Crear puntos y textos
    const dotsAndText = points.map(p => `
        <circle cx="${p.x}%" cy="${p.y}%" r="3" class="price-dot" />
        <text x="${p.x}%" y="${p.y - 12}%" class="price-text">${p.val}M</text>
    `).join('');

    return `
        <svg class="price-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points="${polylinePoints}" class="price-line" vector-effect="non-scaling-stroke"/>
            ${dotsAndText}
        </svg>
    `;
}

// GLOBAL: Acordeón
window.toggleDetails = function(btn) {
    const details = btn.nextElementSibling;
    if (details.style.display === "block") {
        details.style.display = "none";
        btn.innerHTML = 'Ver análisis <i class="fa-solid fa-chart-simple"></i>';
    } else {
        details.style.display = "block";
        btn.innerHTML = 'Ocultar <i class="fa-solid fa-chevron-up"></i>';
    }
};

document.addEventListener('DOMContentLoaded', cargarMercado);