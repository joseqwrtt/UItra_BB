// history.js - Versión Corregida y Precisa
const mapaNombres = {
    'guia_importar_contenidos.html': 'Copia Masiva',
    'proceso_rubricas.html': 'Rúbricas e IA',
    'guia_vista_previa.html': 'Vista Previa',
    'guia_turnitin.html': 'Turnitin',
    'guia_smowl.html': 'Smowl',
    'guia_kaltura.html': 'Kaltura Media',
    'banco_preguntas.html': 'Generador Exámenes',
    'grupos_aulas_ultra.html': 'Generador Grupos'
};

// Mapa detallado: asocia cada subcarpeta con su icono del index
const configuracionCategorias = {
    'evaluacion': { icono: '📝' },
    'examenes': { icono: '📝' },
    'actividades': { icono: '📝' },
    'calificaciones': { icono: '📊' },
    'ponderaciones': { icono: '📊' },
    'gestion-columnas': { icono: '📊' },
    'rubricas': { icono: '📊' },
    'grupos_alumnos': { icono: '👥' },
    'generador-grupos': { icono: '👥' },
    'importar-grupos': { icono: '👥' },
    'excepciones': { icono: '👥' },
    'herramientas_externas': { icono: '🛠️' },
    'herramientas_web_externas': { icono: '🛠️' },
    'KalturaMedia': { icono: '🛠️' },
    'organizacion': { icono: '📢' },
    'organizacion-contenido': { icono: '📢' },
    'publicacion': { icono: '📢' },
    'anuncios': { icono: '📢' },
    'foros': { icono: '📢' }
};

function registrarVisita(urlOriginal) {
    // 1. Limpiar ruta para el index
    let urlRelativaAlIndex = urlOriginal.replace('../', '').replace('../', ''); // Limpia hasta 2 niveles
    const nombreArchivo = urlRelativaAlIndex.split('/').pop();

    // 2. Detectar icono buscando cualquier carpeta de la ruta en nuestro mapa
    let icono = '📄'; 
    for (let carpeta in configuracionCategorias) {
        if (urlOriginal.includes(carpeta)) {
            icono = configuracionCategorias[carpeta].icono;
            break;
        }
    }

    // 3. Obtener nombre bonito
    let nombreLimpio = mapaNombres[nombreArchivo] || 
                       nombreArchivo.replace('.html', '').replace(/_/g, ' ');
    
    nombreLimpio = nombreLimpio.charAt(0).toUpperCase() + nombreLimpio.slice(1);

    const nombreFinal = `${icono} ${nombreLimpio}`;

    let historial = JSON.parse(localStorage.getItem('bb_historial')) || [];
    historial = historial.filter(item => item.url !== urlRelativaAlIndex);
    historial.unshift({ nombre: nombreFinal, url: urlRelativaAlIndex });
    
    localStorage.setItem('bb_historial', JSON.stringify(historial.slice(0, 4)));
}

function renderizarRecientes() {
    const contenedor = document.getElementById('recientes');
    if (!contenedor) return;

    const datos = JSON.parse(localStorage.getItem('bb_historial')) || [];
    if (datos.length === 0) return;

    let html = '<span style="width:100%; display:block; margin-bottom:8px; font-size:0.7rem; color:#888; text-transform:uppercase; font-weight:bold;">Recientes</span>';
    html += datos.map(guia => `
        <a href="${guia.url}" class="mini-card" onclick="registrarVisita('${guia.url}')">
            ${guia.nombre}
        </a>`).join('');

    contenedor.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', renderizarRecientes);

// --- VERIFICACIÓN DE COMPATIBILIDAD ---
function verificarSoporte() {
    try {
        const testKey = "__test__";
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
    } catch (e) {
        console.error("LocalStorage no disponible:", e);
        
        // Creamos un aviso visual que aparecerá sobre el buscador
        const contenedorRecientes = document.getElementById('recientes');
        if (contenedorRecientes) {
            contenedorRecientes.innerHTML = `
                <div style="background: #fff3cd; color: #856404; padding: 10px; border-radius: 8px; border: 1px solid #ffeeba; font-size: 0.8rem; margin-top: 10px; text-align: center;">
                    <strong>⚠️ Navegador no compatible o Almacenamiento bloqueado:</strong><br>
                    Para ver tus "Recientes", asegúrate de no estar en modo incógnito y de que no tienes bloqueadas las cookies/datos de sitio.
                </div>`;
        }
    }
}

// Llamamos a la verificación al cargar
document.addEventListener('DOMContentLoaded', verificarSoporte);
// --------------------------------------

// ... resto de tu código (mapaNombres, iconosCategoria, etc.)