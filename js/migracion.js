import { db } from "./firebase-config.js";
import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Función asíncrona para poder usar await
async function ejecutarMigracion() {
    console.log("⏳ Iniciando migración...");

    try {
        // 1. Apuntamos a la colección CORRECTA: "atletas"
        const querySnapshot = await getDocs(collection(db, "atletas"));

        if (querySnapshot.empty) {
            console.warn("⚠️ No se encontraron atletas. ¿Seguro que tienes datos?");
            return;
        }

        querySnapshot.forEach(async (documento) => {
            const data = documento.data();
            
            // 2. Comprobamos si le falta el historial
            if (!data.historial_puntos) {
                
                const atletaRef = doc(db, "atletas", documento.id);

                // 3. Actualizamos usando la sintaxis moderna
                await updateDoc(atletaRef, {
                    historial_puntos: [], 
                    historial_valor: [data.precio] 
                });

                console.log(`✅ Atleta actualizado: ${data.nombre}`);
            } else {
                console.log(`⏭️ ${data.nombre} ya estaba actualizado.`);
            }
        });

    } catch (error) {
        console.error("❌ Error en la migración:", error);
    }
}

// Ejecutamos la función
ejecutarMigracion();