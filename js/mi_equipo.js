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

// --- ESTADO ---
let currentUserData = null;
let allAthletes = [];
// El equipo son 3 huecos. Si hay jugador es un objeto, si no es null.
let teamSlots = [null, null, null]; 
let captainId = null; // ID del capitán
let totalPatrimony = 0;
let currentBudget = 0;
let isMarketClosed = false;

// Variable para saber qué hueco estamos llenando (0, 1 o 2)
let currentSlotIndex = -1;



// --- 2. INIT ---
async function init() {
    const userNick = localStorage.getItem('fantasy_user');
    if (!userNick) {
        alert("Inicia sesión primero");
        window.location.href = '../index.html';
        return;
    }

    checkMarketStatus();

    try {
        // Cargar Usuario
        const userDoc = await getDoc(doc(db, "usuarios", userNick));
        if (!userDoc.exists()) return;
        currentUserData = userDoc.data();

        // Cargar Atletas
        const athSnap = await getDocs(collection(db, "atletas"));
        allAthletes = [];
        athSnap.forEach(d => {
            let a = d.data();
            a.id = d.id;
            allAthletes.push(a);
        });

        // RECONSTRUIR EQUIPO Y CAPITÁN
        const savedIds = currentUserData.equipo || [];
        captainId = currentUserData.capitanId || null; // Leemos el capitán guardado

        // Rellenar los slots (máximo 3)
        savedIds.forEach((id, index) => {
            if (index < 3) {
                const player = allAthletes.find(a => a.id === id);
                if (player) teamSlots[index] = player;
            }
        });

        // Si el capitán guardado ya no está en el equipo, resetearlo
        if (captainId && !teamSlots.some(p => p && p.id === captainId)) {
            captainId = null;
        }

        // Cálculos
        const initialTeamValue = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
        totalPatrimony = (currentUserData.presupuesto || 0) + initialTeamValue;

        updateUI();

    } catch (error) {
        console.error("Error:", error);
    }
}

// --- 3. ACTUALIZAR UI ---
function updateUI() {
    const currentTeamCost = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
    currentBudget = totalPatrimony - currentTeamCost;

    const maxDebt = totalPatrimony * 0.07;
    const isValidDebt = currentBudget >= -maxDebt;

    // Presupuesto
    const budgetEl = document.getElementById('budgetValue');
    budgetEl.innerText = currentBudget.toFixed(1) + "M";
    budgetEl.className = 'budget-value ' + (currentBudget < 0 ? 'negative' : 'positive');

    // Warning Deuda
    const warnEl = document.getElementById('debtWarning');
    if (currentBudget < 0) {
        warnEl.style.display = 'block';
        warnEl.innerText = isValidDebt ? `⚠️ Deuda OK (Máx -${maxDebt.toFixed(1)}M)` : `⛔ Deuda Excesiva`;
        warnEl.style.color = isValidDebt ? 'orange' : 'red';
    } else {
        warnEl.style.display = 'none';
    }

    // PINTAR LOS 3 SLOTS
    renderSlot(0, 'slot0'); // Arriba
    renderSlot(1, 'slot1'); // Abajo Izq
    renderSlot(2, 'slot2'); // Abajo Der

    // Botón Guardar
    const btnSave = document.getElementById('btnSaveTeam');
    if (!isMarketClosed) {
        if (!isValidDebt) {
            btnSave.disabled = true;
            btnSave.innerText = "DEUDA EXCESIVA";
        } else {
            btnSave.disabled = false;
            btnSave.innerText = "GUARDAR CAMBIOS";
        }
    }
}

function renderSlot(index, elementId) {
    const container = document.getElementById(elementId);
    const player = teamSlots[index];

    container.innerHTML = "";

    if (player) {
        // ESTADO: LLENO
        container.className = "player-card-slot filled";
        
        // ¿Es capitán?
        const isCapi = (player.id === captainId);
        const capiClass = isCapi ? "active" : "";

        container.innerHTML = `
            <img src="${player.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png'}" class="slot-img">
            <div class="slot-name">${player.nombre}</div>
            <div class="slot-price">${player.precio}M</div>
            
            <div class="card-actions">
                <button class="btn-mini btn-captain ${capiClass}" onclick="toggleCaptain('${player.id}', event)">C</button>
                <button class="btn-mini btn-remove" onclick="clearSlot(${index}, event)">X</button>
            </div>
        `;
        // Quitamos el onclick del contenedor padre para que no abra el modal si pulsamos botones
        container.onclick = null; 

    } else {
        // ESTADO: VACÍO
        container.className = "player-card-slot";
        container.innerHTML = `
            <i class="fa-solid fa-plus" style="font-size: 2rem; color: #444;"></i>
            <span style="font-size: 0.8rem; color: #666; margin-top:5px;">Fichar</span>
        `;
        // Al hacer click en lo vacío, abrimos modal
        container.onclick = () => openModal(index);
    }
}

// --- 4. GESTIÓN DEL CAPITÁN ---
window.toggleCaptain = (pid, event) => {
    event.stopPropagation(); // Evita abrir modal si hubiera click
    if (captainId === pid) {
        captainId = null; // Quitar capi
    } else {
        captainId = pid; // Nuevo capi
    }
    updateUI();
};

window.clearSlot = (index, event) => {
    event.stopPropagation();
    const p = teamSlots[index];
    if (p && p.id === captainId) captainId = null; // Si borras al capi, adiós capi
    
    teamSlots[index] = null;
    updateUI();
};

// --- 5. MODAL DE FICHAJES ---
window.openModal = (index) => {
    if (isMarketClosed) return alert("Mercado Cerrado");
    currentSlotIndex = index;
    renderMarketList();
    document.getElementById('playerModal').style.display = 'flex';
};

window.closeModal = () => {
    document.getElementById('playerModal').style.display = 'none';
};

function renderMarketList() {
    const listContainer = document.getElementById('modalPlayerList');
    const search = document.getElementById('modalSearch').value.toLowerCase();
    listContainer.innerHTML = "";

    // Filtro: No mostrar los que YA están en el equipo (en otros slots)
    const currentIds = teamSlots.filter(p => p).map(p => p.id);

    const available = allAthletes.filter(a => {
        return !currentIds.includes(a.id) && 
               (a.nombre.toLowerCase().includes(search) || a.apellidos.toLowerCase().includes(search));
    });

    available.sort((a,b) => b.precio - a.precio);

    available.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player-list-item';
        div.innerHTML = `
            <img src="${p.foto}">
            <div style="flex-grow:1;">
                <div style="color:white; font-weight:bold;">${p.nombre} ${p.apellidos}</div>
                <div style="color:#4cd137; font-size:0.8rem;">${p.precio}M - ${p.categoria}</div>
            </div>
            <i class="fa-solid fa-plus" style="color:var(--primary);"></i>
        `;
        div.onclick = () => {
            selectPlayer(p);
        };
        listContainer.appendChild(div);
    });
}

function selectPlayer(player) {
    teamSlots[currentSlotIndex] = player;
    closeModal();
    updateUI();
}

// Búsqueda en modal
window.filtrarModal = () => renderMarketList();


// --- 6. GUARDAR ---
document.getElementById('btnSaveTeam').addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveTeam');
    btn.innerText = "Guardando...";
    btn.disabled = true;

    try {
        const userNick = localStorage.getItem('fantasy_user');
        
        // Guardamos IDs
        const finalIds = teamSlots.filter(p => p).map(p => p.id);
        
        await updateDoc(doc(db, "usuarios", userNick), {
            equipo: finalIds,
            capitanId: captainId || null, // Guardamos también el capitán
            presupuesto: Number(currentBudget.toFixed(1))
        });

        alert("✅ Equipo guardado.");
        // NO recargamos la página para que se vea el resultado. 
        // Solo actualizamos el botón.
        btn.innerText = "GUARDADO CON ÉXITO";
        setTimeout(() => {
            btn.innerText = "GUARDAR CAMBIOS";
            btn.disabled = false;
        }, 2000);

    } catch (error) {
        console.error(error);
        alert("Error al guardar");
        btn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', init);