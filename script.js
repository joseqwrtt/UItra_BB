/**
 * script.js - Lógica para el Generador de Plantillas Blackboard
 * Sincronizado con la lógica de exportación del script Python original
 */

const tiposPreguntas = {
    "MC": { "label": "MC", "desc": "Opción múltiple: Una sola respuesta correcta.", "tiene_opciones": true, "min_op": 2, "max_op": 100 },
    "MA": { "label": "MA", "desc": "Varias respuestas correctas.", "tiene_opciones": true, "min_op": 2, "max_op": 100 },
    "TF": { "label": "TF", "desc": "Verdadero / Falso.", "tiene_opciones": false },
    "ESS": { "label": "ESS", "desc": "Ensayo: Respuesta abierta.", "tiene_opciones": false },
    "ORD": { "label": "ORD", "desc": "Ordenación.", "tiene_opciones": true, "min_op": 2, "max_op": 100 },
    "MAT": { "label": "MAT", "desc": "Emparejamiento.", "tiene_opciones": true, "min_op": 2, "max_op": 100 },
    "FIB": { "label": "FIB", "desc": "Rellenar espacio en blanco.", "tiene_opciones": true, "min_op": 1, "max_op": 100 },
    "FIB_PLUS": { "label": "FIB_PLUS", "desc": "Múltiples variables.", "tiene_opciones": true, "min_op": 1, "max_op": 10 },
    "FIL": { "label": "FIL", "desc": "Subida de archivo.", "tiene_opciones": false },
    "NUM": { "label": "NUM", "desc": "Respuesta numérica.", "tiene_opciones": false },
    "SR": { "label": "SR", "desc": "Respuesta corta.", "tiene_opciones": false },
    "OP": { "label": "OP", "desc": "Escala de opinión.", "tiene_opciones": true, "min_op": 1, "max_op": 100 },
    "JUMBLED_SENTENCE": { "label": "JUMBLED_SENTENCE", "desc": "Oración confusa.", "tiene_opciones": true, "min_op": 1, "max_op": 100 },
    "QUIZ_BOWL": { "label": "QUIZ_BOWL", "desc": "Estilo concurso.", "tiene_opciones": true, "min_op": 1, "max_op": 100 }
};

const entradasCantPreg = {};
const entradasOpciones = {};

// --- INICIALIZACIÓN DE TABLA ---
function generarTabla() {
    const tbody = document.querySelector('#questionsTable tbody');
    if (!tbody) return;
    for (const tipo in tiposPreguntas) {
        const info = tiposPreguntas[tipo];
        const row = tbody.insertRow();
        row.insertCell().innerHTML = `<button class="info-button" onclick="mostrarInfo('${tipo}')">ℹ️</button>`;
        row.insertCell().textContent = `${info.label} - ${info.desc}`;
        const inputCant = document.createElement('input');
        inputCant.type = 'number'; inputCant.min = '0'; inputCant.value = '0';
        inputCant.oninput = actualizarTotal;
        row.insertCell().appendChild(inputCant);
        entradasCantPreg[tipo] = inputCant;
        const cellOp = row.insertCell();
        if (info.tiene_opciones) {
            const sel = document.createElement('select');
            for (let i = info.min_op; i <= info.max_op; i++) {
                const opt = document.createElement('option');
                opt.value = i; opt.textContent = i; sel.appendChild(opt);
            }
            cellOp.appendChild(sel);
            entradasOpciones[tipo] = sel;
        } else { cellOp.textContent = '-'; }
    }
}

function actualizarTotal() {
    let t = 0;
    for (let k in entradasCantPreg) t += parseInt(entradasCantPreg[k].value) || 0;
    const totalElem = document.getElementById('totalPreguntas');
    if (totalElem) totalElem.textContent = t;
}

// --- CONVERSIÓN EXCEL A TXT (LÓGICA PYTHON) ---
async function convertirExcelATXT() {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files.length) return alert("Selecciona un archivo.");

    const reader = new FileReader();
    reader.onload = async (e) => {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(e.target.result);
        const worksheet = workbook.getWorksheet(1);
        let txtLines = [];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Saltar cabecera

            const tipo = row.getCell(1).text.trim();
            const pregunta = row.getCell(2).text.trim();
            if (!tipo || !pregunta) return;

            let rowData = [tipo, pregunta];

            if (tipo === "TF") {
                // Caso Verdadero/Falso: Solo la respuesta correcta
                rowData.push(row.getCell(3).text.trim().toLowerCase());
            } 
            else if (tipo === "ESS" || tipo === "FIL" || tipo === "NUM" || tipo === "SR") {
                // Tipos sin opciones extra: Solo Tipo y Pregunta
            } 
            else {
                // Casos con múltiples opciones (MC, MA, MAT, ORD, etc.)
                // Recorremos las columnas de respuestas (3, 5, 7...) y estados (4, 6, 8...)
                for (let c = 3; c <= row.cellCount; c += 2) {
                    const resp = row.getCell(c).text.trim();
                    const estado = row.getCell(c + 1).text.trim().toLowerCase();
                    
                    if (resp) {
                        rowData.push(resp);
                        // Solo añadimos 'correct/incorrect' si el tipo lo requiere (MC, MA)
                        if (tipo === "MC" || tipo === "MA") {
                            rowData.push(estado || "incorrect");
                        }
                    }
                }
            }
            // Unir con tabuladores y limpiar espacios en blanco
            txtLines.push(rowData.join('\t'));
        });

        const blob = new Blob([txtLines.join('\r\n')], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, "preguntas_blackboard.txt");
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

// --- RESTO DE FUNCIONES (Excel, Modal) ---
async function generarExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Preguntas');
    let maxOpciones = 0;
    const lista = [];

    // Estilo gris para celdas bloqueadas (como el "gris" de tu Python)
    const fillGris = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC0C0C0' }
    };

    // 1. Determinar el máximo de opciones para las columnas
    for (const tipo in tiposPreguntas) {
        const cant = parseInt(entradasCantPreg[tipo].value) || 0;
        if (cant > 0) {
            if (tiposPreguntas[tipo].tiene_opciones) {
                const ops = parseInt(entradasOpciones[tipo].value);
                if (ops > maxOpciones) maxOpciones = ops;
            }
            lista.push({ tipo, cant });
        }
    }
    
    if (lista.length === 0) return alert("Indica al menos una cantidad de preguntas.");

    // 2. Crear encabezados
    const header = ["Tipo", "Texto de la pregunta"];
    for (let i = 1; i <= maxOpciones; i++) {
        header.push(`Respuesta ${i}`, `Seleccione opción ${i}`);
    }
    const headerRow = worksheet.addRow(header);
    headerRow.font = { bold: true };

    // 3. Generar filas con validaciones y estilos
    lista.forEach(item => {
        const info = tiposPreguntas[item.tipo];
        const numOpcionesPregunta = info.tiene_opciones ? parseInt(entradasOpciones[item.tipo].value) : 0;

        for (let i = 0; i < item.cant; i++) {
            const row = worksheet.addRow([item.tipo, ""]);
            
            // Caso Verdadero/Falso (TF)
            if (item.tipo === "TF") {
                const cellTF = row.getCell(3);
                cellTF.dataValidation = {
                    type: 'list',
                    allowBlank: true,
                    formulae: ['"true,false"']
                };
                // Bloquear el resto de columnas de respuestas
                for (let c = 4; c <= (2 + maxOpciones * 2); c++) {
                    row.getCell(c).fill = fillGris;
                }
            } 
            // Casos Opción Múltiple (MC) y Multi-Respuesta (MA)
            else if (item.tipo === "MC" || item.tipo === "MA") {
                for (let j = 1; j <= maxOpciones; j++) {
                    const colRespuesta = 1 + (j * 2); // Col 3, 5, 7...
                    const colEstado = colRespuesta + 1; // Col 4, 6, 8...

                    if (j <= numOpcionesPregunta) {
                        // Añadir desplegable correct/incorrect
                        row.getCell(colEstado).dataValidation = {
                            type: 'list',
                            allowBlank: true,
                            formulae: ['"correct,incorrect"']
                        };
                    } else {
                        // Bloquear celdas sobrantes
                        row.getCell(colRespuesta).fill = fillGris;
                        row.getCell(colEstado).fill = fillGris;
                    }
                }
            }
            // Otros tipos (ORD, MAT, FIB, etc.)
            else {
                for (let j = 1; j <= maxOpciones; j++) {
                    const colRespuesta = 1 + (j * 2);
                    const colEstado = colRespuesta + 1;

                    if (j <= numOpcionesPregunta) {
                        // En estos tipos, el "Estado" suele estar bloqueado en tu Python
                        row.getCell(colEstado).fill = fillGris;
                    } else {
                        row.getCell(colRespuesta).fill = fillGris;
                        row.getCell(colEstado).fill = fillGris;
                    }
                }
            }
        }
    });

    // 4. Autoajuste de columnas (opcional pero recomendado)
    worksheet.columns.forEach(column => {
        column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Plantilla_Blackboard.xlsx");
}
async function mostrarInfo(tipo) {
    const modal = document.getElementById('infoModal');
    document.getElementById('modalTitle').textContent = `Ayuda: ${tipo}`;
    document.getElementById('modalContent').textContent = "Cargando...";
    modal.style.display = 'block';
    try {
        const res = await fetch(`FAQ/${tipo}.txt`);
        document.getElementById('modalContent').textContent = res.ok ? await res.text() : tiposPreguntas[tipo].desc;
    } catch { document.getElementById('modalContent').textContent = tiposPreguntas[tipo].desc; }
}

document.addEventListener('DOMContentLoaded', () => {
    generarTabla();
    if(document.getElementById('btnGenerarExcel')) document.getElementById('btnGenerarExcel').onclick = generarExcel;
    if(document.getElementById('btnConvertirTXT')) document.getElementById('btnConvertirTXT').onclick = convertirExcelATXT;
    document.querySelector('.close-button').onclick = () => document.getElementById('infoModal').style.display = 'none';
});