/**
 * Implementación de la lógica de ConjuntoGrupos_Ultra.py en JavaScript.
 * Genera un archivo CSV compatible con la importación de grupos en Blackboard Ultra.
 */

// --- Utilidades ---
function limpiarNombre(texto) {
    /** Elimina caracteres inválidos y sustituye espacios por guiones bajos para nombres de archivo/códigos. */
    if (!texto) return '';
    // Elimina \ / * ? : " < > | y sustituye espacios por _
    return texto.trim().replace(/[\\/*?:"<>|]/g, "").replace(/\s+/g, "_");
}

function generarCSV() {
    const tituloBase = document.getElementById('tituloBase').value.trim();
    const cantidadStr = document.getElementById('cantidadGrupos').value.trim();
    const conjunto = document.getElementById('nombreConjunto').value.trim();
    // Convierte el estado del checkbox a "Y" o "N"
    const selfEnroll = document.getElementById('selfEnroll').checked ? "Y" : "N";
    const duplicar = document.getElementById('duplicarGrupos').checked;

    // Validación
    if (!tituloBase || !cantidadStr || !conjunto) {
        alert("Por favor, completa todos los campos (Título base, Cantidad y Nombre del conjunto).");
        return;
    }

    let cantidad;
    try {
        cantidad = parseInt(cantidadStr);
        if (isNaN(cantidad) || cantidad <= 0) {
            throw new Error("Cantidad debe ser un número entero positivo.");
        }
    } catch (e) {
        alert("Error de validación: La cantidad debe ser un número entero positivo.");
        return;
    }

    // --- Generación de datos ---
    
    // Obtener timestamp (YYYYMMDDHHMMSS) para el Group Code
    const now = new Date();
    const timestamp = now.getFullYear().toString() + 
                      (now.getMonth() + 1).toString().padStart(2, '0') + 
                      now.getDate().toString().padStart(2, '0') + 
                      now.getHours().toString().padStart(2, '0') + 
                      now.getMinutes().toString().padStart(2, '0') + 
                      now.getSeconds().toString().padStart(2, '0');
                      
    const conjuntoLimpio = limpiarNombre(conjunto);
    const codigoPrefijo = `${conjuntoLimpio}_${timestamp}`;

    const filas = [];
    const encabezado = ["Group Code*", "Title*", "Description", "Group Set*", "Self Enroll*"];
    // Unir el encabezado usando coma
    filas.push(encabezado.join(',')); 

    let totalGrupos = 0;

    // 1. Generar grupos normales
    for (let i = 1; i <= cantidad; i++) {
        const groupCode = `New_gc_${codigoPrefijo}_${i}`;
        const title = `${tituloBase} ${i}`;
        const fila = [groupCode, title, "", conjunto, selfEnroll];
        // Usar comillas alrededor de cada campo para evitar problemas si el título contiene comas
        filas.push(fila.map(item => `"${item}"`).join(',')); 
        totalGrupos++;
    }

    // 2. Generar grupos duplicados (individuales), continuando la numeración del código de grupo
    if (duplicar) {
        for (let i = 1; i <= cantidad; i++) {
            const groupCode = `New_gc_${codigoPrefijo}_${cantidad + i}`; // Continuar el índice (e.g., si cant=5, este empieza en 6)
            const title = `${tituloBase} (individual) ${i}`;
            const fila = [groupCode, title, "", conjunto, selfEnroll];
            filas.push(fila.map(item => `"${item}"`).join(','));
            totalGrupos++;
        }
    }

    // --- Descarga del archivo ---
    const tituloLimpio = limpiarNombre(tituloBase);
    const sufijo = duplicar ? "x2" : "x1";
    const nombreArchivo = `Grupos_${conjuntoLimpio}_${tituloLimpio}_${cantidad}_${sufijo}.csv`;

    // Crear el contenido del CSV
    const csvContent = filas.join('\n');
    // Usar Blob para crear el archivo en memoria y descargarlo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`✅ Éxito: Archivo generado y descargado.\n\nTotal de grupos creados: ${totalGrupos}`);
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnGenerarCSV').addEventListener('click', generarCSV);
});