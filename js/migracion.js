// Asegúrate de que 'db' es tu referencia a Firestore
db.collection("mercado").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const ref = doc.ref;

        // Solo actualizamos si NO tiene historial todavía
        if (!data.historial_puntos) {
            
            // 1. Array de puntos vacío
            // 2. Array de valor con su precio ACTUAL como punto de partida
            ref.update({
                historial_puntos: [], 
                historial_valor: [data.precio] 
            }).then(() => {
                console.log(`Atleta ${data.nombre} actualizado correctamente.`);
            });
            
        }
    });
    console.log("Migración terminada.");
});