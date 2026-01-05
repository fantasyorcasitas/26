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
let teamSlots = [null, null, null]; 
let captainId = null;
let totalPatrimony = 0;
let currentSlotIndex = -1;

// --- INIT ---
async function init() {
    const userNick = localStorage.getItem('fantasy_user');
    if (!userNick) { window.location.href = '../index.html'; return; }

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
            // Aseguramos que precio es número
            a.precio = parseInt(a.precio) || 0; 
            allAthletes.push(a);
        });

        // Reconstruir equipo
        const savedIds = currentUserData.equipo || [];
        captainId = currentUserData.capitanId || null;

        savedIds.forEach((id, index) => {
            if (index < 3) {
                const player = allAthletes.find(a => a.id === id);
                if (player) teamSlots[index] = player;
            }
        });

        // Calcular Patrimonio Total (Dinero en caja + Valor Equipo Actual)
        const teamValue = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
        // El presupuesto guardado en la BD es el dinero "sobrante".
        // Patrimonio = Presupuesto Guardado + Valor Equipo
        totalPatrimony = (parseInt(currentUserData.presupuesto) || 0) + teamValue;

        updateUI();

    } catch (error) {
        console.error(error);
    }
}

// --- ACTUALIZAR UI ---
function updateUI() {
    // 1. Calcular Coste Actual del Equipo
    const currentTeamCost = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
    
    // 2. Presupuesto Restante = Patrimonio - Coste Equipo
    const currentBudget = totalPatrimony - currentTeamCost;

    // 3. Actualizar Barra
    const budgetEl = document.getElementById('budgetValue');
    // Sin decimales, número entero
    budgetEl.innerText = Math.round(currentBudget) + "M"; 
    
    if (currentBudget < 0) {
        budgetEl.classList.remove('positive');
        budgetEl.classList.add('negative');
        document.getElementById('debtWarning').style.display = 'block';
        document.getElementById('btnSaveTeam').disabled = true;
        document.getElementById('btnSaveTeam').innerText = "DEUDA EXCESIVA";
    } else {
        budgetEl.classList.remove('negative');
        budgetEl.classList.add('positive');
        document.getElementById('debtWarning').style.display = 'none';
        document.getElementById('btnSaveTeam').disabled = false;
        document.getElementById('btnSaveTeam').innerText = "GUARDAR CAMBIOS";
    }

    // 4. Renderizar Slots
    renderSlot(0, 'slot0');
    renderSlot(1, 'slot1');
    renderSlot(2, 'slot2');
}

function renderSlot(index, elementId) {
    const container = document.getElementById(elementId);
    const player = teamSlots[index];
    container.innerHTML = "";

    if (player) {
        container.className = "player-card-slot filled";
        
        // Capitán
        const isCapi = (player.id === captainId);
        const capiClass = isCapi ? "active" : "";

        // Foto por defecto
        const imgUrl = player.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png';

        container.innerHTML = `
            <img src="${imgUrl}" class="slot-img">
            <div class="slot-name">${player.nombre}</div>
            <div class="slot-price">${player.precio}M</div>
            
            <div class="card-actions">
                <button class="btn-mini btn-captain ${capiClass}" data-id="${player.id}">C</button>
                <button class="btn-mini btn-remove" data-index="${index}">X</button>
            </div>
        `;

        // Asignar eventos a los botones DENTRO del HTML generado
        container.querySelector('.btn-captain').onclick = (e) => {
            e.stopPropagation();
            toggleCaptain(player.id);
        };
        container.querySelector('.btn-remove').onclick = (e) => {
            e.stopPropagation();
            clearSlot(index);
        };
        // Quitar evento de abrir modal si está lleno
        container.onclick = null;

    } else {
        container.className = "player-card-slot";
        container.innerHTML = `
            <i class="fa-solid fa-plus" style="font-size: 1.5rem; color: #666;"></i>
            <span style="font-size: 0.7rem; color: #666; margin-top:5px; font-weight:600;">FICHAR</span>
        `;
        container.onclick = () => openModal(index);
    }
}

// --- FUNCIONES LÓGICAS ---

function toggleCaptain(pid) {
    if (captainId === pid) captainId = null; // Quitar
    else captainId = pid; // Poner
    updateUI();
}

function clearSlot(index) {
    const p = teamSlots[index];
    if (p && p.id === captainId) captainId = null;
    teamSlots[index] = null;
    updateUI();
}

// --- MODAL ---
function openModal(index) {
    currentSlotIndex = index;
    renderMarketList();
    document.getElementById('playerModal').style.display = 'flex';
}

// Vinculamos input search
document.getElementById('modalSearch').addEventListener('keyup', renderMarketList);

function renderMarketList() {
    const container = document.getElementById('modalPlayerList');
    const search = document.getElementById('modalSearch').value.toLowerCase();
    container.innerHTML = "";

    // IDs ya usados
    const usedIds = teamSlots.filter(p => p).map(p => p.id);

    const available = allAthletes.filter(a => {
        const matchName = a.nombre.toLowerCase().includes(search);
        return !usedIds.includes(a.id) && matchName;
    });

    // Ordenar por precio desc
    available.sort((a,b) => b.precio - a.precio);

    available.forEach(p => {
        const div = document.createElement('div');
        div.className = 'player-list-item';
        div.innerHTML = `
            <img src="${p.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png'}">
            <div style="flex-grow:1;">
                <div style="color:white; font-weight:bold;">${p.nombre}</div>
                <div style="color:#ff5e00; font-size:0.8rem;">${p.precio}M | ${p.categoria || 'JUG'}</div>
            </div>
            <i class="fa-solid fa-plus-circle" style="color:#4cd137; font-size:1.2rem;"></i>
        `;
        div.onclick = () => selectPlayer(p);
        container.appendChild(div);
    });
}

function selectPlayer(player) {
    teamSlots[currentSlotIndex] = player;
    document.getElementById('playerModal').style.display = 'none';
    updateUI();
}

// --- GUARDAR ---
document.getElementById('btnSaveTeam').addEventListener('click', async () => {
    const btn = document.getElementById('btnSaveTeam');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GUARDANDO...';
    btn.disabled = true;

    try {
        const userNick = localStorage.getItem('fantasy_user');
        
        // Calcular presupuesto final REAL
        const cost = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
        const finalBudget = totalPatrimony - cost;

        const teamIds = teamSlots.filter(p => p).map(p => p.id);

        await updateDoc(doc(db, "usuarios", userNick), {
            equipo: teamIds,
            capitanId: captainId || null,
            presupuesto: Math.round(finalBudget) // Guardar sin decimales
        });

        btn.style.background = "#4cd137";
        btn.innerHTML = '<i class="fa-solid fa-check"></i> GUARDADO';
        
        setTimeout(() => {
            btn.style.background = "#ff5e00";
            btn.innerHTML = 'GUARDAR CAMBIOS';
            btn.disabled = false;
        }, 2000);

    } catch (e) {
        console.error(e);
        btn.innerText = "ERROR";
    }
});

// Arrancar
document.addEventListener('DOMContentLoaded', init);