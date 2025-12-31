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
let allAthletes = []; 
let myTeam = []; 
let totalPatrimony = 0; 
let currentBudget = 0; 
let isMarketClosed = false;

// --- 1. VERIFICAR MERCADO CERRADO ---
function checkMarketStatus() {
    const now = new Date();
    const day = now.getDay(); 
    const hour = now.getHours();

    // Sábado (6), Domingo (0), Lunes (1) -> CERRADO
    // Martes (2) antes de las 10:00 -> CERRADO
    if (day === 6 || day === 0 || day === 1 || (day === 2 && hour < 10)) {
        isMarketClosed = true;
        const msg = document.getElementById('marketClosedMsg');
        const btn = document.getElementById('btnSaveTeam');
        if(msg) msg.style.display = 'flex';
        if(btn) {
            btn.disabled = true;
            btn.innerText = "MERCADO CERRADO";
        }
        return false;
    }
    return true;
}

// --- 2. CARGAR DATOS (INIT) ---
async function init() {
    // A. SEGURIDAD: Comprobamos si hay usuario
    const userNick = localStorage.getItem('fantasy_user');
    
    console.log("--> Iniciando Mi Equipo. Usuario detectado:", userNick);

    if (!userNick) {
        console.warn("⛔ No estás logueado. Redirigiendo a la portada...");
        alert("Debes iniciar sesión para gestionar tu equipo.");
        window.location.href = '../index.html'; // CORREGIDO: Te manda al index (login)
        return;
    }

    // B. Comprobar Horario
    checkMarketStatus();

    try {
        // C. Cargar datos del Usuario desde Firebase
        const userDoc = await getDoc(doc(db, "usuarios", userNick));
        
        if (!userDoc.exists()) {
            console.error("El usuario no existe en la BD.");
            return;
        }
        currentUserData = userDoc.data();

        // D. Cargar TODOS los atletas
        const athSnap = await getDocs(collection(db, "atletas"));
        allAthletes = [];
        athSnap.forEach(d => {
            let a = d.data();
            a.id = d.id;
            allAthletes.push(a);
        });

        // E. Reconstruir Equipo Actual
        const savedTeamIds = currentUserData.equipo || []; 
        // Convertimos IDs en objetos reales
        myTeam = savedTeamIds.map(id => allAthletes.find(a => a.id === id)).filter(a => a);

        // F. Cálculos Financieros Iniciales
        // Patrimonio Total = Lo que tienes en caja + Lo que valen tus jugadores hoy
        const initialTeamValue = myTeam.reduce((sum, p) => sum + p.precio, 0);
        totalPatrimony = (currentUserData.presupuesto || 0) + initialTeamValue;

        updateUI();

    } catch (error) {
        console.error("Error cargando equipo:", error);
    }
}

// --- 3. ACTUALIZAR INTERFAZ ---
function updateUI() {
    // Coste actual de los 3 (o menos) jugadores seleccionados
    const currentTeamCost = myTeam.reduce((sum, p) => sum + p.precio, 0);
    
    // Presupuesto Restante = Patrimonio - Coste Equipo
    currentBudget = totalPatrimony - currentTeamCost;

    // Regla del 7%: Deuda máxima permitida
    const maxDebt = totalPatrimony * 0.07; 
    const isValidDebt = currentBudget >= -maxDebt;

    // Pintar Barra Presupuesto
    const budgetEl = document.getElementById('budgetValue');
    if(budgetEl) {
        budgetEl.innerText = currentBudget.toFixed(1) + "M";
        budgetEl.className = 'budget-value ' + (currentBudget < 0 ? 'negative' : 'positive');
    }
    
    // Avisos de Deuda
    const warningEl = document.getElementById('debtWarning');
    if(warningEl) {
        if (currentBudget < 0) {
            warningEl.style.display = 'block';
            if (isValidDebt) {
                warningEl.innerText = `⚠️ En deuda (Ok hasta -${maxDebt.toFixed(1)}M)`;
                warningEl.style.color = "orange";
            } else {
                warningEl.innerText = `⛔ Deuda excesiva (Máx -${maxDebt.toFixed(1)}M)`;
                warningEl.style.color = "red";
            }
        } else {
            warningEl.style.display = 'none';
        }
    }

    // Pintar Slots (Huecos)
    const slotsContainer = document.getElementById('teamSlots');
    if(slotsContainer) {
        slotsContainer.innerHTML = "";
        for (let i = 0; i < 3; i++) {
            const player = myTeam[i];
            const div = document.createElement('div');
            
            if (player) {
                div.className = "team-slot filled";
                div.innerHTML = `
                    <button class="btn-remove-player" onclick="removePlayer('${player.id}')">X</button>
                    <img src="${player.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png'}" class="slot-player-img">
                    <div class="slot-player-name">${player.nombre}</div>
                    <div class="slot-player-price">${player.precio}M</div>
                `;
            } else {
                div.className = "team-slot";
                div.innerHTML = `<span style="color:#444; font-size:2rem;">+</span><span style="color:#666; font-size:0.8rem;">Vacío</span>`;
            }
            slotsContainer.appendChild(div);
        }
    }

    // Renderizar Mercado
    renderMarket();

    // Botón Guardar
    const btnSave = document.getElementById('btnSaveTeam');
    if(btnSave) {
        if (isMarketClosed) {
            btnSave.disabled = true;
        } else {
            if (!isValidDebt) {
                btnSave.disabled = true;
                btnSave.innerText = "DEUDA EXCESIVA";
            } else {
                btnSave.disabled = false;
                btnSave.innerText = "GUARDAR CAMBIOS";
            }
        }
    }
}

// --- 4. RENDERIZAR MERCADO ---
function renderMarket() {
    const container = document.getElementById('marketList');
    const searchInput = document.getElementById('marketSearch');
    if(!container) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    
    container.innerHTML = "";

    // Filtramos jugadores disponibles
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

// --- 5. ACCIONES GLOBALES (Para que funcione el onclick del HTML) ---

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
const saveBtn = document.getElementById('btnSaveTeam');
if(saveBtn) {
    saveBtn.addEventListener('click', async () => {
        const btn = document.getElementById('btnSaveTeam');
        btn.innerText = "Guardando...";
        btn.disabled = true;

        try {
            const userNick = localStorage.getItem('fantasy_user');
            
            // 1. Array de IDs
            const teamIds = myTeam.map(p => p.id);
            
            // 2. Nuevo Presupuesto
            await updateDoc(doc(db, "usuarios", userNick), {
                equipo: teamIds,
                presupuesto: Number(currentBudget.toFixed(1))
            });

            alert("✅ Equipo guardado correctamente.");
            window.location.reload();

        } catch (error) {
            console.error(error);
            alert("Error al guardar: " + error.message);
            btn.disabled = false;
            btn.innerText = "GUARDAR CAMBIOS";
        }
    });
}

// ARRANCAR
document.addEventListener('DOMContentLoaded', init);