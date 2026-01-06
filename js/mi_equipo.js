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
let isMarketClosed = false;

// --- 1. COMPROBAR MERCADO (LÓGICA CORREGIDA) ---
function checkMarketStatus() {
    const now = new Date();
    const day = now.getDay(); // 0=Domingo, 1=Lunes, 2=Martes... 6=Sábado
    const hour = now.getHours();

    // BLOQUEO:
    // Sábado (6), Domingo (0), Lunes (1) -> CERRADO TODO EL DÍA
    // Martes (2) -> CERRADO ANTES DE LAS 10:00 (hour < 10)
    
    if (day === 6 || day === 0 || day === 1 || (day === 2 && hour < 8)) {
        isMarketClosed = true;
        
        // Bloqueo Visual (Overlay)
        const overlay = document.getElementById('marketClosedMsg');
        if(overlay) overlay.style.display = 'flex';

        // Bloqueo Botón Guardar
        const btn = document.getElementById('btnSaveTeam');
        if(btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> CERRADO';
            btn.style.backgroundColor = "#333";
        }
        return false; // Mercado Cerrado
    }

    // SI NO ES NINGUNO DE ESOS DÍAS/HORAS -> ABIERTO
    isMarketClosed = false;
    const overlay = document.getElementById('marketClosedMsg');
    if(overlay) overlay.style.display = 'none';
    
    return true; // Mercado Abierto
}

// --- 2. INIT ---
async function init() {
    // 1. Verificar si está cerrado
    checkMarketStatus();

    const userNick = localStorage.getItem('fantasy_user');
    if (!userNick) { window.location.href = '../index.html'; return; }

    try {
        // 2. Cargar Usuario
        const userDoc = await getDoc(doc(db, "usuarios", userNick));
        if (!userDoc.exists()) return;
        currentUserData = userDoc.data();

        // 3. Cargar Atletas
        const athSnap = await getDocs(collection(db, "atletas"));
        allAthletes = [];
        athSnap.forEach(d => {
            let a = d.data();
            a.id = d.id;
            a.precio = parseInt(a.precio) || 0; 
            allAthletes.push(a);
        });

        // 4. Reconstruir equipo
        const savedIds = currentUserData.equipo || [];
        captainId = currentUserData.capitanId || null;

        savedIds.forEach((id, index) => {
            if (index < 3) {
                const player = allAthletes.find(a => a.id === id);
                if (player) teamSlots[index] = player;
            }
        });

        // Calcular Patrimonio
        const teamValue = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
        totalPatrimony = (parseInt(currentUserData.presupuesto) || 0) + teamValue;

        updateUI();

    } catch (error) {
        console.error(error);
    }
}

// --- 3. ACTUALIZAR UI ---
function updateUI() {
    const currentTeamCost = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
    const currentBudget = totalPatrimony - currentTeamCost;

    const budgetEl = document.getElementById('budgetValue');
    budgetEl.innerText = Math.round(currentBudget) + "M"; 
    
    if (currentBudget < 0) {
        budgetEl.classList.remove('positive');
        budgetEl.classList.add('negative');
        document.getElementById('debtWarning').style.display = 'block';
        if(!isMarketClosed) {
            document.getElementById('btnSaveTeam').disabled = true;
            document.getElementById('btnSaveTeam').innerText = "DEUDA EXCESIVA";
        }
    } else {
        budgetEl.classList.remove('negative');
        budgetEl.classList.add('positive');
        document.getElementById('debtWarning').style.display = 'none';
        
        if(!isMarketClosed) {
            document.getElementById('btnSaveTeam').disabled = false;
            document.getElementById('btnSaveTeam').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> GUARDAR CAMBIOS';
            document.getElementById('btnSaveTeam').style.backgroundColor = "#ff5e00";
        }
    }

    renderSlot(0, 'slot0');
    renderSlot(1, 'slot1');
    renderSlot(2, 'slot2');
}

function renderSlot(index, elementId) {
    const container = document.getElementById(elementId);
    const player = teamSlots[index];
    container.innerHTML = "";

    // Clase visual para deshabilitado
    const disabledClass = isMarketClosed ? "disabled-slot" : "";

    if (player) {
        container.className = `player-card-slot filled ${disabledClass}`;
        const isCapi = (player.id === captainId);
        const capiClass = isCapi ? "active" : "";
        const imgUrl = player.foto || 'https://cdn-icons-png.flaticon.com/512/74/74472.png';

        const actionsHTML = isMarketClosed ? '' : `
            <div class="card-actions">
                <button class="btn-mini btn-captain ${capiClass}" data-cap-idx="${index}">C</button>
                <button class="btn-mini btn-remove" data-rem-idx="${index}">X</button>
            </div>
        `;

        container.innerHTML = `
            <img src="${imgUrl}" class="slot-img">
            <div class="slot-name">${player.nombre}</div>
            <div class="slot-price">${player.precio}M</div>
            ${actionsHTML}
        `;

        // Asignamos eventos manualmente para asegurar que funcionan
        if (!isMarketClosed) {
            const btnCap = container.querySelector(`[data-cap-idx="${index}"]`);
            const btnRem = container.querySelector(`[data-rem-idx="${index}"]`);
            
            if(btnCap) btnCap.onclick = (e) => { e.stopPropagation(); toggleCaptain(player.id); };
            if(btnRem) btnRem.onclick = (e) => { e.stopPropagation(); clearSlot(index); };
        }
        
        container.onclick = null; // Si está lleno, el contenedor no hace nada (solo los botones)

    } else {
        container.className = `player-card-slot ${disabledClass}`;
        container.innerHTML = `
            <i class="fa-solid fa-plus" style="font-size: 1.5rem; color: #666;"></i>
            <span style="font-size: 0.7rem; color: #666; margin-top:5px; font-weight:600;">FICHAR</span>
        `;
        
        // SOLO si está abierto permitimos abrir el modal
        if(!isMarketClosed) {
            container.onclick = () => openModal(index);
        } else {
            container.onclick = null;
        }
    }
}

// --- 4. FUNCIONES LÓGICAS ---
function toggleCaptain(pid) {
    if(isMarketClosed) return;
    captainId = (captainId === pid) ? null : pid;
    updateUI();
}

function clearSlot(index) {
    if(isMarketClosed) return;
    const p = teamSlots[index];
    if (p && p.id === captainId) captainId = null;
    teamSlots[index] = null;
    updateUI();
}

// --- 5. MODAL (DEFINICIÓN LOCAL SEGURA) ---
function openModal(index) {
    if (isMarketClosed) return; // Seguridad extra
    currentSlotIndex = index;
    renderMarketList();
    document.getElementById('playerModal').style.display = 'flex';
}

// Evento para cerrar modal (usando el botón del HTML)
window.closeModal = function() {
    document.getElementById('playerModal').style.display = 'none';
}

document.getElementById('modalSearch').addEventListener('keyup', renderMarketList);

function renderMarketList() {
    const container = document.getElementById('modalPlayerList');
    const search = document.getElementById('modalSearch').value.toLowerCase();
    container.innerHTML = "";

    const usedIds = teamSlots.filter(p => p).map(p => p.id);
    const available = allAthletes.filter(a => {
        const matchName = a.nombre.toLowerCase().includes(search);
        return !usedIds.includes(a.id) && matchName;
    });

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
        // Usamos una función flecha para pasar el objeto 'p'
        div.onclick = () => selectPlayer(p);
        container.appendChild(div);
    });
}

function selectPlayer(player) {
    teamSlots[currentSlotIndex] = player;
    document.getElementById('playerModal').style.display = 'none';
    updateUI();
}

// --- 6. GUARDAR ---
const btnSave = document.getElementById('btnSaveTeam');
if(btnSave) {
    btnSave.addEventListener('click', async () => {
        if(isMarketClosed) return; 

        btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> GUARDANDO...';
        btnSave.disabled = true;

        try {
            const userNick = localStorage.getItem('fantasy_user');
            const cost = teamSlots.reduce((sum, p) => sum + (p ? p.precio : 0), 0);
            const finalBudget = totalPatrimony - cost;
            const teamIds = teamSlots.filter(p => p).map(p => p.id);

            await updateDoc(doc(db, "usuarios", userNick), {
                equipo: teamIds,
                capitanId: captainId || null,
                presupuesto: Math.round(finalBudget)
            });

            btnSave.style.background = "#4cd137";
            btnSave.innerHTML = '<i class="fa-solid fa-check"></i> GUARDADO';
            
            setTimeout(() => {
                btnSave.style.background = "#ff5e00";
                btnSave.innerHTML = 'GUARDAR CAMBIOS';
                btnSave.disabled = false;
            }, 2000);

        } catch (e) {
            console.error(e);
            btnSave.innerText = "ERROR AL GUARDAR";
        }
    });
}

document.addEventListener('DOMContentLoaded', init);