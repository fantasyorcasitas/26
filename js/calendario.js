import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

async function cargarCalendario() {
    const container = document.getElementById('calendarContainer');
    container.innerHTML = '<p style="color:white; text-align:center; padding:20px;">Cargando temporada...</p>';

    try {
        // Ordenamos por fecha ascendente (de más antiguo a más nuevo)
        // Nota: Si las fechas en BD son string "YYYY-MM-DD", el orden alfabético funciona como cronológico
        const q = query(collection(db, "competiciones"), orderBy("fecha", "asc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = '<p style="color:#aaa; text-align:center;">No hay competiciones programadas aún.</p>';
            return;
        }

        container.innerHTML = ""; // Limpiar mensaje de carga

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // FORMATEAR FECHA (De "2024-05-20" a Día: 20, Mes: MAY)
            const dateObj = new Date(data.fecha);
            const dia = dateObj.getDate();
            const mes = dateObj.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
            
            // GENERAR TABLA DE PARTICIPANTES
            let htmlParticipantes = '';
            if (data.participantes && data.participantes.length > 0) {
                htmlParticipantes = data.participantes.map(p => `
                    <tr>
                        <td><strong style="color: #ff5e00;">${p.prueba}</strong></td>
                        <td>${p.nombre_completo}</td>
                    </tr>
                `).join('');
            } else {
                htmlParticipantes = '<tr><td colspan="2" style="text-align:center; color:#666;">Sin participantes confirmados</td></tr>';
            }

            // ENLACES
            let htmlLinks = '';
            if (data.links) {
                htmlLinks = `
                    <div style="margin-top:15px; padding-top:10px; border-top:1px dashed #333;">
                        <a href="${data.links}" target="_blank" style="color: #4cd137; text-decoration:none; font-size:0.9rem;">
                            <i class="fa-solid fa-link"></i> Links
                        </a>
                    </div>
                `;
            }

            // CREAR TARJETA
            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div class="event-header">
                    <div class="date-box">
                        <span class="date-day">${dia}</span>
                        <span class="date-month">${mes}</span>
                    </div>
                    <div class="event-info">
                        <h3>${data.nombre}</h3>
                        <p><i class="fa-solid fa-location-dot"></i> ${data.lugar}</p>
                        <p style="font-size:0.8rem; color:#666; margin-top:2px;">
                            ${data.pruebas_resumen || 'Varias pruebas'}
                        </p>
                    </div>
                </div>

                <button class="btn-event-toggle" onclick="toggleEvent(this)">
                    Ver Start List e Info <i class="fa-solid fa-chevron-down"></i>
                </button>

                <div class="event-details">
                    <h4 style="color:white; margin-bottom:10px; font-size:0.9rem; text-transform:uppercase;">
                        Atletas Inscritos
                    </h4>
                    <table class="start-list-table">
                        <thead>
                            <tr>
                                <th width="30%">Prueba</th>
                                <th>Atleta</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${htmlParticipantes}
                        </tbody>
                    </table>
                    ${htmlLinks}
                </div>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error calendario:", error);
        container.innerHTML = '<p style="color:red; text-align:center;">Error al cargar calendario.</p>';
    }
}

// Función global para el acordeón
window.toggleEvent = function(btn) {
    const details = btn.nextElementSibling;
    const icon = btn.querySelector('i');
    
    if (details.style.display === "block") {
        details.style.display = "none";
        btn.style.color = "#888";
        icon.className = "fa-solid fa-chevron-down";
    } else {
        details.style.display = "block";
        btn.style.color = "white";
        icon.className = "fa-solid fa-chevron-up";
    }
};

document.addEventListener('DOMContentLoaded', cargarCalendario);