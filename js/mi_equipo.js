import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// --- VARIABLES DE ESTADO ---
let currentUserData = null;
let allAthletes = []; // Catálogo completo
let myTeam = []; // Array de objetos atletas seleccionados actualmente
let initialTeamValue = 0; // Valor del equipo al cargar la página (para calcular cambios)
let totalPatrimony = 0; // Presupuesto + Valor Equipo Inicial
let currentBudget = 0; // Presupuesto dinámico
let isMarketClosed = false;

// --- 1. VERIFICAR MERCADO CERRADO ---
function checkMarketStatus() {
    const now = new Date();
    const day = now.getDay(); // 0 Domingo, 1 Lunes, 2 Martes, ..., 6 Sábado
    const hour = now.getHours();

    // Sábado (6), Domingo (0), Lunes (1) -> CERRADO
    // Martes (2) antes de las 10:00 -> CERRADO
    if (day === 6 || day === 0 || day === 1 || (day === 2 && hour < 10)) {
        isMarketClosed = true;
        document.getElementById('marketClosedMsg').style.display = 'flex';
        document.getElementById('btnSaveTeam').disabled = true;
        document.getElementById('btnSaveTeam').innerText = "MERCADO CERRADO";
        return false;
    }
    return true;
}

// --- 2. CARGAR DATOS ---
async function init() {
    const userNick = localStorage.getItem('fantasy_user');
    if (!userNick) {
        window.location.href = '../login.html';
        return;
    }

    // A. Comprobar Horario
    checkMarketStatus();

    try {
        // B. Cargar Usuario
        const userDoc = await getDoc(doc(db, "usuarios", userNick));
        if (!userDoc.exists()) return;
        currentUserData = userDoc.data();

        // C. Cargar TODOS los atletas (para tener precios actualizados)
        const athSnap = await getDocs(collection(db, "atletas"));
        allAthletes = [];
        athSnap.forEach(d => {
            let a = d.data();
            a.id = d.id;
            allAthletes.push(a);
        });

        // D. Reconstruir Equipo Actual
        // El usuario tiene un array de IDs en 'equipo'
        const savedTeamIds = currentUserData.equipo || []; 
        
        // Convertimos IDs en objetos reales con precio ACTUALIZADO
        myTeam = savedTeamIds.map(id => allAthletes.find(a => a.id === id)).filter(a => a); // Filtramos nulos por si se borró un atleta

        // E. Cálculos Financieros Iniciales
        // Patrimonio = Dinero en Caja + Valor de Jugadores que ya tienes
        initialTeamValue = myTeam.reduce((sum, p) => sum + p.precio, 0);
        totalPatrimony = (currentUserData.presupuesto || 0) + initialTeamValue;

        updateUI();

    } catch (error) {
        console.error("Error cargando equipo:", error);
    }
}

// --- 3. ACTUALIZAR INTERFAZ Y CÁLCULOS ---
function updateUI() {
    // 1. Calcular Coste del Equipo Seleccionado Actualmente
    const currentTeamCost = myTeam.reduce((sum, p) => sum + p.precio, 0);
    
    // 2. Calcular Presupuesto Restante
    currentBudget = totalPatrimony - currentTeamCost;

    // 3. Validar Deuda (Regla del 7%)
    // Límite de deuda = 7% del Presupuesto (asumimos presupuesto base 100M o patrimonio?)
    // El usuario dijo: "Si tengo 100M puedo quedarme hasta -7M".
    // Usaremos el Patrimonio Total como referencia de "lo que tienes".
    const maxDebt = totalPatrimony * 0.07; 
    const isValidDebt = currentBudget >= -maxDebt;

    // 4. Renderizar Barra Presupuesto
    const budgetEl = document.getElementById('budgetValue');
    budgetEl.innerText = currentBudget.toFixed(1) + "M";
    
    // Colores y Avisos
    const warningEl = document.getElementById('debtWarning');
    const btnSave = document.getElementById('btnSaveTeam');

    budgetEl.className = 'budget-value ' + (currentBudget < 0 ? 'negative' : 'positive');

    if (currentBudget < 0) {
        warningEl.style.display = 'block';
        if (isValidDebt) {
            warningEl.innerText = `⚠️ En deuda (Permitido hasta -${maxDebt.toFixed(1)}M)`;
            warningEl.style.color = "orange";
        } else {
            warningEl.innerText = `⛔ Deuda excesiva (Máx -${maxDebt.toFixed(1)}M)`;
            warningEl.style.color = "red";
        }
    } else {
        warningEl.style.display = 'none';
    }

    // 5. Renderizar Slots del Equipo (Arriba)
    const slotsContainer = document.getElementById('teamSlots');
    slotsContainer.innerHTML = "";

    // Siempre pintamos 3 huecos
    for (let i = 0; i < 3; i++) {
        const player = myTeam[i];
        const div = document.createElement('div');
        
        if (player) {
            // Hueco Lleno
            div.className = "team-slot filled";
            div.innerHTML = `
                <button class="btn-remove-player" onclick="removePlayer('${player.id}')">X</button>
                <img src="${player.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png'}" class="slot-player-img">
                <div class="slot-player-name">${player.nombre}</div>
                <div class="slot-player-price">${player.precio}M</div>
            `;
        } else {
            // Hueco Vacío
            div.className = "team-slot";
            div.innerHTML = `<span style="color:#444; font-size:2rem;">+</span><span style="color:#666; font-size:0.8rem;">Vacío</span>`;
        }
        slotsContainer.appendChild(div);
    }

    // 6. Renderizar Mercado (Abajo)
    renderMarket();

    // 7. Activar/Desactivar Botón Guardar
    if (isMarketClosed) {
        btnSave.disabled = true;
    } else {
        // Se puede guardar si:
        // a) El equipo está lleno (3 jugadores) O incompleto (se permite guardar incompleto?) -> Asumimos que sí.
        // b) La deuda es válida
        if (!isValidDebt) {
            btnSave.disabled = true;
            btnSave.innerText = "DEUDA EXCESIVA";
        } else {
            btnSave.disabled = false;
            btnSave.innerText = "GUARDAR CAMBIOS";
        }
    }
}

// --- 4. RENDERIZAR LISTA DE MERCADO ---
function renderMarket() {
    const container = document.getElementById('marketList');
    const searchTerm = document.getElementById('marketSearch').value.toLowerCase();
    
    container.innerHTML = "";

    // Filtramos: Que NO esté ya en mi equipo Y que coincida con búsqueda
    const availablePlayers = allAthletes.filter(a => {
        const inTeam = myTeam.find(p => p.id === a.id);
        const matchesName = a.nombre.toLowerCase().includes(searchTerm) || a.apellidos.toLowerCase().includes(searchTerm);
        return !inTeam && matchesName;
    });

    // Ordenar por precio
    availablePlayers.sort((a, b) => b.precio - a.precio);

    availablePlayers.forEach(p => {
        const item = document.createElement('div');
        item.className = "market-item";
        
        // Comprobar si podemos ficharlo (si hay hueco)
        const canBuy = myTeam.length < 3 && !isMarketClosed;

        item.innerHTML = `
            <img src="${p.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png'}">
            <div class="market-info">
                <div class="market-name">${p.nombre} ${p.apellidos}</div>
                <div class="market-price">${p.precio}M</div>
            </div>
            <button class="btn-add-player" ${canBuy ? '' : 'disabled'} onclick="addPlayer('${p.id}')">
                ${canBuy ? '+' : 'LLENO'}
            </button>
        `;
        container.appendChild(item);
    });
}

// --- 5. ACCIONES (Globales para HTML) ---

window.addPlayer = (id) => {
    if (myTeam.length >= 3) return;
    const player = allAthletes.find(a => a.id === id);
    if (player) {
        myTeam.push(player);
        updateUI();
    }
};

window.removePlayer = (id) => {
    myTeam = myTeam.filter(p => p.id !== id);
    updateUI();
};

window.filtrarMercado = () => {
    renderMarket();
};

// --- 6. GUARDAR EN FIREBASE ---
document.getElementById('btnSaveTeam').addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveTeam');
    btn.innerText = "Guardando...";
    btn.disabled = true;

    try {
        const userNick = localStorage.getItem('fantasy_user');
        
        // Guardamos:
        // 1. Array de IDs
        const teamIds = myTeam.map(p => p.id);
        
        // 2. Nuevo Presupuesto (Lo que queda en caja)
        // OJO: Si entra en negativo válido (-5M), se guarda así.
        
        await updateDoc(doc(db, "usuarios", userNick), {
            equipo: teamIds,
            presupuesto: Number(currentBudget.toFixed(1)) // Guardamos el float limpio
        });

        alert("✅ Equipo guardado correctamente.");

    } catch (error) {
        console.error(error);
        alert("Error al guardar.");
    } finally {
        // Recargar para confirmar datos
        window.location.reload();
    }
});

// Arrancar
document.addEventListener('DOMContentLoaded', init);