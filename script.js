const POCKETBASE_URL = "http://10.93.229.82:8080";
const pb = new PocketBase(POCKETBASE_URL);

const CLAVE_CONFIGURACION = 'suculenta-configuracion';
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const IMAGEN_PREDETERMINADA = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzNTAiIGZpbGw9IiNlMmU4ZjAiLz4KICBDASVBY2xlIGN4PSIyNTAiIGN5PSIxMjAiIHI9IjcwIiBmaWxsPSIjZmZmZmZmIi8+CiAgPHBhdGggZD0iTTM0MCAyMzBjMjAtNjUgODAtMTEwIDExMC0xMjAgMjYtMTAgNDktMjYgNjItNDggMTktMzEgMTQtNjYtMTUtODVTMzYxIDcwIDMzMiA3MGMtMzEtMTktNjYtMTQtODUgMTUtMjQgMzEtMzUgNjctMjUgOTJjMjUgNjAgNzAgMTA1IDExMCAxMjAgMzAgMTAgNjAgMTAgOTQgMCAzMCAxNSA2NSA0NSA4NSIgZmlsbD0iIzQ0OTI3MyIvPgo8L3N2Zz4=';
const NIVELES_SOL = {
    poco: { label: 'Poco sol', className: 'low-sun' },
    indirecto: { label: 'Sol indirecto', className: 'indirect-sun' },
    directo: { label: 'Sol directo', className: 'direct-sun' }
};
const NIVEL_SOL_PREDETERMINADO = 'indirecto';

// Estado vivo de la sesion y de la pantalla actual.
let usuarioActual = null;
let plantas = [];
let registrosCuidado = [];
let diarioNube = [];
let medicionesAmbiente = [];
let plantasMostradas = [];
let cargaPlantasExitosa = false;
let colaRecordatoriosAndroid = Promise.resolve();
let mesActual = new Date().getMonth();
let anioActual = new Date().getFullYear();
let indiceEdicionActual = null;
let configuracion = {
    theme: 'light',
    customColor: '#4d8b4d'
};

// Referencias DOM del login y registro.
const casillaSinFertilizanteSeco = document.getElementById('no-fertilizer');
const casillaSinFertilizanteLiquido = document.getElementById('no-liquid-fertilizer');
const pantallaInicioSesion = document.getElementById('login-screen');
const formularioInicioSesion = document.getElementById('login-form');
const pantallaRegistro = document.getElementById('register-screen');
const formularioRegistro = document.getElementById('register-form');
const botonMostrarRegistro = document.getElementById('toggle-register');
const botonMostrarInicioSesion = document.getElementById('toggle-login');
const textoUsuario = document.getElementById('user-display');
const botonCerrarSesion = document.getElementById('logout-btn');

// Referencias DOM de la aplicacion principal.
const formularioPlanta = document.getElementById('plant-form');
const tituloFormulario = document.getElementById('form-title');
const botonEnviar = document.getElementById('submit-button');
const botonCancelarEdicion = document.getElementById('cancel-edit-button');
const grillaPlantas = document.getElementById('plants-grid');
const galeriaGrid = document.getElementById('galeria-grid');
const contenedorCalendario = document.getElementById('calendar');
const interruptorTema = document.getElementById('theme-switch');
const selectorColor = document.getElementById('color-picker');
const botonesPestana = document.querySelectorAll('.tab-btn');
const secciones = document.querySelectorAll('.section');
const inputArchivoImagen = document.getElementById('plant-image-file');
const vistaPreviaImagen = document.getElementById('image-preview');
const imagenVistaPrevia = document.getElementById('preview-img');
const modalDia = document.getElementById('day-modal');
const tituloModal = document.getElementById('modal-date-title');
const cuerpoModal = document.getElementById('modal-body');
const botonCerrarModalDia = document.getElementById('close-day-modal');
const modalNotas = document.getElementById('notes-modal');
const tituloModalNotas = document.getElementById('notes-modal-title');
const cuerpoModalNotas = document.getElementById('notes-modal-body');
const botonCerrarModalNotas = document.getElementById('close-notes-modal');

// Muestra un mensaje temporal debajo de un formulario.
function mostrarMensaje(elementId, mensaje, esError = false) {
    const elemento = document.getElementById(elementId);
    if (elemento) {
        elemento.textContent = mensaje;
        elemento.className = 'login-message' + (esError ? ' error' : ' success');
        setTimeout(() => {
            elemento.textContent = '';
            elemento.className = 'login-message';
        }, 3000);
    }
}

function describirErrorPocketBase(error, accion) {
    const respuesta = error?.response;
    const estado = respuesta?.status;
    const datos = respuesta?.data || {};
    const erroresCampos = datos?.data && typeof datos.data === 'object'
        ? datos.data
        : datos;
    const detalles = Object.entries(erroresCampos || {})
        .filter(([, valor]) => valor && typeof valor === 'object' && valor.message)
        .map(([campo, valor]) => `${campo}: ${valor.message}`);

    if (detalles.length) {
        return `No se pudo ${accion}:\n${detalles.join('\n')}`;
    }

    if (respuesta && (respuesta.message || estado)) {
        const mensaje = respuesta.message || error?.message || 'El servidor rechazó la solicitud.';
        return `No se pudo ${accion} (HTTP ${estado || '?'}): ${mensaje}`;
    }

    return `No llegó respuesta de PocketBase (${POCKETBASE_URL}). Comprueba que PocketBase Mobile siga iniciado y que su IP y puerto coincidan con esta dirección (${POCKETBASE_URL}/api/health).`;
}

// Botones que alternan entre login y registro.
botonMostrarRegistro.addEventListener('click', () => {
    pantallaInicioSesion.classList.add('hidden');
    pantallaRegistro.classList.remove('hidden');
});

botonMostrarInicioSesion.addEventListener('click', () => {
    pantallaRegistro.classList.add('hidden');
    pantallaInicioSesion.classList.remove('hidden');
});

formularioRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if (!usuario) {
        mostrarMensaje('register-message', 'Ingresa un usuario', true);
        return;
    }

    if (password.length < 8) {
        mostrarMensaje('register-message', 'La contraseña debe tener al menos 8 caracteres', true);
        return;
    }

    if (password !== passwordConfirm) {
        mostrarMensaje('register-message', 'Las contraseñas no coinciden', true);
        return;
    }

    try {

        await pb.collection("users").create({
            email: `${usuario}@suculenta.local`,
            password: password,
            passwordConfirm: passwordConfirm,
            usuario: usuario
        });

        mostrarMensaje(
            'register-message',
            'Cuenta creada correctamente.'
        );

        formularioRegistro.reset();

        setTimeout(() => {
            pantallaRegistro.classList.add('hidden');
            pantallaInicioSesion.classList.remove('hidden');
        }, 1000);

    } catch (error) {
        console.error('Error al crear la cuenta en PocketBase:', error);
        alert(describirErrorPocketBase(error, 'crear la cuenta'));

    }
});

formularioInicioSesion.addEventListener('submit', async (e) => {
    e.preventDefault();

    const usuario = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!usuario || !password) {
        mostrarMensaje('login-message', 'Completa todos los campos', true);
        return;
    }

    try {

        const authData = await pb.collection("users").authWithPassword(
            `${usuario}@suculenta.local`,
            password
        );

        usuarioActual = authData.record;

        textoUsuario.textContent = `Bienvenido, ${usuarioActual.usuario}`;

        pantallaInicioSesion.classList.add("hidden");

        formularioInicioSesion.reset();

        await cargarPlantas();
        await procesarColaOffline();

        renderizarVistasPrincipales();

    } catch (error) {

        console.error(error);

        mostrarMensaje(
            "login-message",
            "Usuario o contraseña incorrectos.",
            true
        );

    }
});

botonCerrarSesion.addEventListener('click', () => {

    localStorage.setItem(claveLocal('suculenta-recordatorios-activos'), 'false');
    cancelarRecordatoriosAndroid();

    pb.authStore.clear();

    usuarioActual = null;
    plantas = [];

    formularioInicioSesion.reset();
    formularioRegistro.reset();

    pantallaInicioSesion.classList.remove('hidden');

    textoUsuario.textContent = 'Usuario';

});

async function cargarPlantas() {

    if (!usuarioActual) {
        plantas = [];
        cargaPlantasExitosa = false;
        return;
    }

    try {

        const registros = await pb.collection("plantas").getFullList({
            sort: "created",
            filter: `user="${usuarioActual.id}"`
        });

        plantas = registros.map(planta => normalizarPlanta({
            id: planta.id,
            nombre: planta.nombre,
            nombrecientifico: planta.nombrecientifico,
            imagen: planta.imagen
                ? pb.files.getURL(planta, planta.imagen)
                : IMAGEN_PREDETERMINADA,
            fotosgaleria: planta.fotosgaleria
                ? planta.fotosgaleria.map(f =>
                    pb.files.getURL(planta, f)
                )
                : [],
            frecuenciariego: Number(planta.frecuenciariego),
            frecuenciafertilizante: planta.frecuenciafertilizante,
            frecuenciafertilizanteliquido: planta.frecuenciafertilizanteliquido,
            nivelsol: planta.nivelsol,
            ubicacion: planta.ubicacion || '',
            avisoriego: planta.avisoriego,
            avisoabono: planta.avisoabono,
            horaaviso: planta.horaaviso || '',
            updated: planta.updated,
            fechaultimoriego: planta.fechaultimoriego,
            fechaultimafertilizacion: planta.fechaultimafertilizacion,
            fechaultimafertilizacionliquida: planta.fechaultimafertilizacionliquida,
            fechacreacion: planta.created
        }));
        cargaPlantasExitosa = true;
        localStorage.setItem(claveLocal('suculenta-plantas-cache'), JSON.stringify(plantas));
        await cargarRegistrosSincronizados();

    }
    catch(error){

        console.error(error);
        try { plantas = JSON.parse(localStorage.getItem(claveLocal('suculenta-plantas-cache')) || '[]'); }
        catch (cacheError) { plantas = []; }
        try { registrosCuidado = JSON.parse(localStorage.getItem(claveLocal('suculenta-cuidados-cache')) || '[]'); }
        catch (cacheError) { registrosCuidado = []; }
        mezclarCuidadosPendientes();
        try { diarioNube = JSON.parse(localStorage.getItem(claveLocal('suculenta-diario-cache')) || '[]'); }
        catch (cacheError) { diarioNube = []; }
        mezclarDiariosPendientes();
        cargaPlantasExitosa = false;

    }

}

async function cargarRegistrosSincronizados() {
    if (!usuarioActual) return;
    try {
        registrosCuidado = await pb.collection('cuidados').getFullList({ sort: '-fecha', filter: `user="${usuarioActual.id}"` });
        mezclarCuidadosPendientes();
        localStorage.setItem(claveLocal('suculenta-cuidados-cache'), JSON.stringify(registrosCuidado));
    } catch (error) {
        try { registrosCuidado = JSON.parse(localStorage.getItem(claveLocal('suculenta-cuidados-cache')) || '[]'); }
        catch (cacheError) { registrosCuidado = []; }
        mezclarCuidadosPendientes();
    }
    try {
        medicionesAmbiente = await pb.collection('mediciones_ambiente').getFullList({ sort: '-fecha', filter: `user="${usuarioActual.id}"` });
        await migrarAmbienteLocalAntiguo();
        medicionesAmbiente = await pb.collection('mediciones_ambiente').getFullList({ sort: '-fecha', filter: `user="${usuarioActual.id}"` });
        const ultimaPorPlanta = {};
        medicionesAmbiente.forEach(m => { if (!ultimaPorPlanta[m.planta]) ultimaPorPlanta[m.planta] = { temperature: m.temperatura ?? null, humidity: m.humedad ?? null, date: fechaAString(new Date(m.fecha)) }; });
        const local = leerRegistrosLocales('suculenta-ambiente');
        Object.assign(local, ultimaPorPlanta);
        leerColaOffline().filter(op => op.tipo === 'ambiente').forEach(op => {
            const anterior = local[op.plantaId];
            if (!anterior || new Date(op.fecha) >= new Date(anterior.date || 0)) local[op.plantaId] = { temperature: op.temperatura, humidity: op.humedad, date: fechaAString(new Date(op.fecha)) };
        });
        guardarRegistrosLocales('suculenta-ambiente', local);
        localStorage.setItem(claveLocal('suculenta-ambiente-cache'), JSON.stringify(medicionesAmbiente));
    } catch (error) {
        try { medicionesAmbiente = JSON.parse(localStorage.getItem(claveLocal('suculenta-ambiente-cache')) || '[]'); }
        catch (cacheError) { medicionesAmbiente = []; }
    }
    try {
        diarioNube = await pb.collection('diario').getFullList({ sort: '-fecha', filter: `user="${usuarioActual.id}"` });
        await migrarDiarioLocalAntiguo();
        mezclarDiariosPendientes();
        localStorage.setItem(claveLocal('suculenta-diario-cache'), JSON.stringify(diarioNube));
    } catch (error) {
        try { diarioNube = JSON.parse(localStorage.getItem(claveLocal('suculenta-diario-cache')) || '[]'); }
        catch (cacheError) { diarioNube = []; }
        const diarioLocal = leerRegistrosLocales('suculenta-diario');
        Object.entries(diarioLocal).forEach(([plantaId, entries]) => (entries || []).forEach((entry, index) => {
            if (!diarioNube.some(item => item.planta === plantaId && item.fecha === entry.date && item.texto === entry.text)) {
                diarioNube.push({ id: `legacy-${plantaId}-${index}`, planta: plantaId, fecha: entry.date, texto: entry.text, fotoData: entry.photo, pending: false });
            }
        }));
        mezclarDiariosPendientes();
    }
}

async function migrarAmbienteLocalAntiguo() {
    const marker = claveLocal('suculenta-ambiente-migrado');
    if (localStorage.getItem(marker) === 'true') return;
    const local = leerRegistrosLocales('suculenta-ambiente');
    for (const [plantaId, medicion] of Object.entries(local)) {
        if (!plantas.some(planta => planta.id === plantaId)) continue;
        if (leerColaOffline().some(op => op.tipo === 'ambiente' && op.plantaId === plantaId)) continue;
        const registro = { user: usuarioActual.id, planta: plantaId, fecha: medicion.date ? new Date(medicion.date).toISOString() : new Date().toISOString() };
        if (medicion.temperature !== null && medicion.temperature !== undefined) registro.temperatura = Number(medicion.temperature);
        if (medicion.humidity !== null && medicion.humidity !== undefined) registro.humedad = Number(medicion.humidity);
        try { medicionesAmbiente.push(await pb.collection('mediciones_ambiente').create(registro)); }
        catch (error) { console.warn('Las mediciones locales aún no se migraron.', error); return; }
    }
    localStorage.setItem(marker, 'true');
}

function mezclarDiariosPendientes() {
    const pendientes = leerColaOffline().filter(op => op.tipo === 'diario-crear');
    pendientes.forEach(op => {
        const existe = diarioNube.some(entry => entry.pending && entry.planta === op.plantaId && entry.fecha === op.fecha && entry.texto === op.texto);
        if (!existe) diarioNube.push({ id: `local-${op.queuedAt || op.fecha}`, planta: op.plantaId, fecha: op.fecha, texto: op.texto, fotoData: op.foto, pending: true });
    });
}

function mezclarCuidadosPendientes() {
    leerColaOffline().filter(op => op.tipo === 'cuidado').forEach(op => {
        const existe = registrosCuidado.some(item => item.pending && item.planta === op.plantaId && item.fecha === op.fecha && item.tipo === op.tipoCuidado);
        if (!existe) registrosCuidado.push({ id: `local-${op.queuedAt || op.fecha}-${op.tipoCuidado}`, planta: op.plantaId, fecha: op.fecha, tipo: op.tipoCuidado, pending: true });
    });
}

async function migrarDiarioLocalAntiguo() {
    const marker = claveLocal('suculenta-diario-migrado');
    if (localStorage.getItem(marker) === 'true' || !cargaPlantasExitosa) return;
    const local = leerRegistrosLocales('suculenta-diario');
    const legacyEntries = Object.entries(local).flatMap(([plantaId, entries]) => (entries || []).map(entry => ({ plantaId, ...entry })));
    if (!legacyEntries.length) { localStorage.setItem(marker, 'true'); return; }
    try {
        const migradas = new Set(JSON.parse(localStorage.getItem(claveLocal('suculenta-diario-entradas-migradas')) || '[]'));
        for (const entry of legacyEntries) {
            const llave = `${entry.plantaId}|${entry.date}|${entry.text}`;
            if (migradas.has(llave)) continue;
            const fd = new FormData();
            fd.append('user', usuarioActual.id);
            fd.append('planta', entry.plantaId);
            fd.append('fecha', new Date(entry.date || Date.now()).toISOString());
            fd.append('texto', entry.text || '');
            if (entry.photo?.startsWith('data:')) fd.append('foto', archivoDesdeDataURL(entry.photo, 'diario.jpg'));
            await pb.collection('diario').create(fd);
            migradas.add(llave);
            localStorage.setItem(claveLocal('suculenta-diario-entradas-migradas'), JSON.stringify([...migradas]));
        }
        localStorage.setItem(marker, 'true');
        diarioNube = await pb.collection('diario').getFullList({ sort: '-fecha', filter: `user="${usuarioActual.id}"` });
    } catch (error) { console.warn('El diario anterior aún no se pudo migrar.', error); }
}

// Utilidades compartidas para fechas, HTML, imagenes y datos.
function pad(numero) {
    return numero.toString().padStart(2, '0');
}

function fechaAString(fecha) {
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

// Escapa texto antes de meterlo en innerHTML para evitar HTML accidental.
function escaparHTML(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caracter => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[caracter]));
}

// Convierte una fecha guardada a YYYY-MM-DD.
function formatearFechaGuardada(valor) {
    if (!valor) return 'Sin registro';
    const fecha = new Date(valor);
    if (isNaN(fecha.getTime())) return 'Sin registro';
    return fechaAString(fecha);
}

// La galeria puede llegar como jsonb o como string JSON; esta funcion la unifica.
function normalizarFotosGaleria(valor) {
    if (Array.isArray(valor)) {
        return valor.filter(Boolean);
    }

    if (typeof valor === 'string' && valor.trim()) {
        try {
            const fotos = JSON.parse(valor);
            return Array.isArray(fotos) ? fotos.filter(Boolean) : [];
        } catch (error) {
            return [];
        }
    }

    return [];
}

// Devuelve fotos de galeria si existen; si no, usa la imagen principal.
function obtenerFotosPlanta(planta) {
    const fotos = normalizarFotosGaleria(planta.fotosgaleria);
    if (fotos.length > 0) return fotos;
    return [planta.imagen || IMAGEN_PREDETERMINADA];
}

function obtenerNivelSol(valor) {
    return NIVELES_SOL[valor] ? valor : NIVEL_SOL_PREDETERMINADO;
}

function obtenerInfoSol(valor) {
    return NIVELES_SOL[obtenerNivelSol(valor)];
}

function obtenerNivelSolFormulario() {
    const seleccionado = document.querySelector('input[name="sunlight-level"]:checked');
    return obtenerNivelSol(seleccionado?.value);
}

function seleccionarNivelSolFormulario(valor) {
    const nivel = obtenerNivelSol(valor);
    const opcion = document.querySelector(`input[name="sunlight-level"][value="${nivel}"]`);
    if (opcion) opcion.checked = true;
}

// Arma el HTML del mosaico que se reutiliza en tarjetas y galeria.
function crearMosaicoFotos(planta, altTexto, limite = 4, opciones = {}) {
    const fotos = obtenerFotosPlanta(planta).slice(0, limite);
    const claseCantidad = `count-${Math.min(fotos.length, limite)}`;
    const puedeEliminar = opciones.eliminable && normalizarFotosGaleria(planta.fotosgaleria).length > 0;
    return `
        <div class="photo-mosaic ${claseCantidad}">
            ${fotos.map((foto, index) => `
                <div class="photo-tile">
                    <img src="${foto}" data-url-original="${foto}" alt="${altTexto}${index > 0 ? ` ${index + 1}` : ''}" onerror="manejarErrorImagen(this)">
                    ${puedeEliminar ? `<button class="gallery-delete-photo" data-indice-planta="${opciones.indicePlanta}" data-indice-foto="${index}" type="button" aria-label="Eliminar foto">Eliminar</button>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

// Parsea una fecha YYYY-MM-DD como fecha local para evitar corrimientos por zona horaria.
function parsearFechaYMD(valor) {
    const [anio, mes, dia] = valor.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}

// Normaliza datos viejos/nuevos para que el resto del codigo use una sola forma.
function normalizarPlanta(planta) {
    planta.nombrecientifico = planta.nombrecientifico || '';
    planta.notas = typeof planta.notas === 'string' ? planta.notas : '';
    planta.ubicacion = planta.ubicacion || '';
    const avisosConfigurados = Boolean(planta.horaaviso);
    planta.avisoriego = !avisosConfigurados || (planta.avisoriego !== false && planta.avisoriego !== 'false');
    planta.avisoabono = !avisosConfigurados || (planta.avisoabono !== false && planta.avisoabono !== 'false');
    planta.horaaviso = planta.horaaviso || '09:00';
    planta.fotosgaleria = normalizarFotosGaleria(planta.fotosgaleria);
    planta.nivelsol = obtenerNivelSol(planta.nivelsol || planta.nivelSol);

    // convertir fertilizante a número real
    planta.frecuenciafertilizante = Number(planta.frecuenciafertilizante);
    planta.frecuenciafertilizanteliquido = Number(planta.frecuenciafertilizanteliquido);

    // si es inválido -> null REAL
    if (
        isNaN(planta.frecuenciafertilizante) ||
        planta.frecuenciafertilizante <= 0
    ) {
        planta.frecuenciafertilizante = null;
        planta.fechaultimafertilizacion = null;
    }

    if (
        isNaN(planta.frecuenciafertilizanteliquido) ||
        planta.frecuenciafertilizanteliquido <= 0
    ) {
        planta.frecuenciafertilizanteliquido = null;
        planta.fechaultimafertilizacionliquida = null;
    }

    // compatibilidad vieja
    if (
    planta.frecuenciaRiego !== undefined &&
    planta.frecuenciariego === undefined
) {
    planta.frecuenciariego = planta.frecuenciaRiego;
}

    if (
        planta.frecuenciaFertilizante !== undefined &&
        planta.frecuenciafertilizante === undefined
    ) {
        planta.frecuenciafertilizante =
            planta.frecuenciaFertilizante;
    }

    if (
        planta.fechaUltimoRiego &&
        !planta.fechaultimoriego
    ) {
        planta.fechaultimoriego =
            planta.fechaUltimoRiego;
    }

    if (
        planta.fechaUltimaFertilizacion &&
        !planta.fechaultimafertilizacion
    ) {
        planta.fechaultimafertilizacion =
            planta.fechaUltimaFertilizacion;
    }

    if (
        planta.fechaUltimaFertilizacionLiquida &&
        !planta.fechaultimafertilizacionliquida
    ) {
        planta.fechaultimafertilizacionliquida =
            planta.fechaUltimaFertilizacionLiquida;
    }

    if (planta.fechaultimorriego && !planta.fechaultimoriego) {
        planta.fechaultimoriego = planta.fechaultimorriego;
        delete planta.fechaultimorriego;
    }

    if (!planta.fechaultimoriego) {
        planta.fechaultimoriego =
            planta.fechacreacion ||
            new Date().toISOString();
    }

    // SOLO crear fecha si realmente tiene fertilizante
    if (
        planta.frecuenciafertilizante !== null &&
        !planta.fechaultimafertilizacion
    ) {
        planta.fechaultimafertilizacion =
            planta.fechacreacion ||
            new Date().toISOString();
    }

    if (
        planta.frecuenciafertilizanteliquido !== null &&
        !planta.fechaultimafertilizacionliquida
    ) {
        planta.fechaultimafertilizacionliquida =
            planta.fechacreacion ||
            new Date().toISOString();
    }

    return planta;
}

function cargarConfiguracion() {
    const guardado = localStorage.getItem(CLAVE_CONFIGURACION);
    if (guardado) {
        try {
            configuracion = { ...configuracion, ...JSON.parse(guardado) };
        } catch (error) {
            console.error('Error al cargar configuraciones:', error);
        }
    }
}

function guardarConfiguracion() {
    localStorage.setItem(CLAVE_CONFIGURACION, JSON.stringify(configuracion));
}

// Calcula si el texto sobre el color principal debe ser claro u oscuro.
function obtenerColorContraste(hexColor) {
    const hex = hexColor.replace('#', '');
    const rojo = parseInt(hex.slice(0, 2), 16);
    const verde = parseInt(hex.slice(2, 4), 16);
    const azul = parseInt(hex.slice(4, 6), 16);
    const brillo = (rojo * 299 + verde * 587 + azul * 114) / 1000;
    return brillo > 150 ? '#0f172a' : '#ffffff';
}

// Aplica el color elegido a variables CSS usadas por botones y acentos.
function aplicarColorPersonalizado(color) {
    const contraste = obtenerColorContraste(color);
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-light', color);
    document.documentElement.style.setProperty('--accent-contrast', contraste);
    document.body.style.setProperty('--accent', color);
    document.body.style.setProperty('--accent-light', color);
    document.body.style.setProperty('--accent-contrast', contraste);
}

// Sincroniza el estado de tema con el body y los controles visuales.
function aplicarTema() {
    document.body.classList.toggle('dark-mode', configuracion.theme === 'dark');
    interruptorTema.checked = configuracion.theme === 'dark';
    selectorColor.value = configuracion.customColor;
    aplicarColorPersonalizado(configuracion.customColor);
}

// Cambia entre tema claro y oscuro y persiste la eleccion.
function cambiarTema() {
    configuracion.theme = configuracion.theme === 'light' ? 'dark' : 'light';
    aplicarTema();
    guardarConfiguracion();
}

// Guarda el nuevo color principal elegido por el usuario.
function cambiarColorPersonalizado(color) {
    configuracion.customColor = color;
    aplicarColorPersonalizado(color);
    guardarConfiguracion();
}

// Convierte un archivo subido por input[type=file] a data URL base64.
// Se usa solo para la vista previa instantanea en el formulario, ya no para
// guardar en la base de datos (eso ahora va a Storage, ver mas abajo).
function archivoABase64(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result);
        lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        lector.readAsDataURL(archivo);
    });
}


// Si una imagen falla, muestra el placeholder para no romper el layout.
function manejarErrorImagen(img) {
    if (!img || img.dataset.recuperandoImagen === 'true') return;
    const url = img.dataset.urlOriginal || img.currentSrc || img.src;
    img.onerror = null;
    if (url && url.startsWith(POCKETBASE_URL) && typeof fetch === 'function') {
        img.dataset.recuperandoImagen = 'true';
        fetch(url).then(respuesta => {
            if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
            return respuesta.blob();
        }).then(blob => {
            img.src = URL.createObjectURL(blob);
            img.classList.remove('broken-image');
        }).catch(error => {
            console.warn('No se pudo cargar una imagen de PocketBase:', error);
            img.src = IMAGEN_PREDETERMINADA;
            img.classList.add('broken-image');
        });
        return;
    }
    img.src = IMAGEN_PREDETERMINADA;
    img.classList.add('broken-image');
}

// Suma la frecuencia a la ultima fecha registrada para obtener la proxima.
function calcularSiguienteFecha(fechaAnterior, frecuenciaDias) {
    const fecha = new Date(fechaAnterior);
    fecha.setHours(0, 0, 0, 0);
    fecha.setDate(fecha.getDate() + frecuenciaDias);
    return fecha;
}

// Devuelve la clase de estado que pinta los iconos: ok, soon u overdue.
function obtenerEstadoCuidado(fechaObjetivo, frecuenciaDias) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const objetivo = new Date(fechaObjetivo);
    objetivo.setHours(0, 0, 0, 0);

    const diasRestantes = Math.ceil((objetivo.getTime() - hoy.getTime()) / 86400000);
    if (diasRestantes < 0) return 'overdue';
    if (diasRestantes <= frecuenciaDias / 2) return 'soon';
    return 'ok';
}

// Genera todos los objetos Date del mes visible en el calendario.
function obtenerDiasDelMes(anio, mes) {
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const dias = [];
    for (let i = 1; i <= diasEnMes; i++) {
        dias.push(new Date(anio, mes, i));
    }
    return dias;
}

// Indica si una fecha del calendario coincide con la proxima actividad.
function esDiaProgramado(fecha, fechaAnterior, frecuenciaDias) {
    if (!fechaAnterior || frecuenciaDias <= 0) return false;
    const siguiente = calcularSiguienteFecha(fechaAnterior, frecuenciaDias);
    return fechaAString(siguiente) === fechaAString(fecha);
}

// Resume si un dia tiene riego, fertilizacion o ambas actividades.
function usaFertilizanteSeco(planta) {
    return planta.frecuenciafertilizante !== null &&
        planta.frecuenciafertilizante !== undefined &&
        !isNaN(planta.frecuenciafertilizante);
}

function usaFertilizanteLiquido(planta) {
    return planta.frecuenciafertilizanteliquido !== null &&
        planta.frecuenciafertilizanteliquido !== undefined &&
        !isNaN(planta.frecuenciafertilizanteliquido);
}

// Resume si un dia tiene riego, fertilizado seco o fertilizante liquido.
function obtenerMarcacionesDia(fecha) {
    let tieneRiego = false;
    let tieneFertilizacionSeca = false;
    let tieneFertilizacionLiquida = false;

    plantas.forEach(planta => {
        if (esDiaProgramado(fecha, planta.fechaultimoriego, planta.frecuenciariego)) {
            tieneRiego = true;
        }
        if (
            usaFertilizanteSeco(planta) &&
            esDiaProgramado(fecha, planta.fechaultimafertilizacion, planta.frecuenciafertilizante)
        ) {
            tieneFertilizacionSeca = true;
        }
        if (
            usaFertilizanteLiquido(planta) &&
            esDiaProgramado(fecha, planta.fechaultimafertilizacionliquida, planta.frecuenciafertilizanteliquido)
        ) {
            tieneFertilizacionLiquida = true;
        }
    });

    return {
        riego: tieneRiego,
        fertilizacion: tieneFertilizacionSeca,
        fertilizacionLiquida: tieneFertilizacionLiquida
    };
}

// Lista las tareas que corresponden a una fecha para poblar el modal.
function obtenerPlantasParaFecha(fecha) {
    const tareas = [];
    plantas.forEach((planta, index) => {
        const siguienteRiego = calcularSiguienteFecha(planta.fechaultimoriego, planta.frecuenciariego);
        let siguienteFertilizacionSeca = null;
        let siguienteFertilizacionLiquida = null;

        if (usaFertilizanteSeco(planta) && planta.fechaultimafertilizacion) {
            siguienteFertilizacionSeca = calcularSiguienteFecha(
                planta.fechaultimafertilizacion,
                planta.frecuenciafertilizante
            );
        }

        if (usaFertilizanteLiquido(planta) && planta.fechaultimafertilizacionliquida) {
            siguienteFertilizacionLiquida = calcularSiguienteFecha(
                planta.fechaultimafertilizacionliquida,
                planta.frecuenciafertilizanteliquido
            );
        }

        if (fecha.getTime() >= siguienteRiego.getTime()) {
            tareas.push({ index, planta, tipo: 'riego', fecha: siguienteRiego });
        }
        if (siguienteFertilizacionSeca && fecha.getTime() >= siguienteFertilizacionSeca.getTime()) {
            tareas.push({ index, planta, tipo: 'fertilizacion', fecha: siguienteFertilizacionSeca });
        }
        if (siguienteFertilizacionLiquida && fecha.getTime() >= siguienteFertilizacionLiquida.getTime()) {
            tareas.push({ index, planta, tipo: 'fertilizacion_liquida', fecha: siguienteFertilizacionLiquida });
        }
    });
    return tareas;
}

// Renderizado: a partir del estado en memoria crea el HTML visible.
function renderizarPlantas() {
    grillaPlantas.innerHTML = '';

    if (plantas.length === 0) {
        grillaPlantas.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">Aun no has anadido plantas. Empieza agregando tu primera suculenta.</p>';
        return;
    }

    const consulta = (document.getElementById('plant-search')?.value || '').trim().toLocaleLowerCase();
    const filtro = document.getElementById('plant-filter')?.value || 'todas';
    plantasMostradas = plantas.filter(planta => {
        const base = `${planta.nombre} ${planta.nombrecientifico || ''} ${planta.ubicacion || ''}`.toLocaleLowerCase();
        if (consulta && !base.includes(consulta)) return false;
        const riegoVencido = calcularSiguienteFecha(planta.fechaultimoriego, planta.frecuenciariego) <= new Date();
        const abonoVencido = (usaFertilizanteSeco(planta) && calcularSiguienteFecha(planta.fechaultimafertilizacion, planta.frecuenciafertilizante) <= new Date()) || (usaFertilizanteLiquido(planta) && calcularSiguienteFecha(planta.fechaultimafertilizacionliquida, planta.frecuenciafertilizanteliquida) <= new Date());
        if (filtro === 'pendientes' && !riegoVencido && !abonoVencido) return false;
        if (filtro === 'riego' && !riegoVencido) return false;
        if (filtro === 'fertilizacion' && !abonoVencido) return false;
        return true;
    });
    if (!plantasMostradas.length) {
        grillaPlantas.innerHTML = '<p class="empty-state">No hay plantas que coincidan con la búsqueda o el filtro.</p>';
        return;
    }

    plantasMostradas.forEach(planta => {
        const index = plantas.indexOf(planta);
        const proximoRiego = calcularSiguienteFecha(
            planta.fechaultimoriego,
            planta.frecuenciariego
        );
        const tieneFertilizanteSeco = usaFertilizanteSeco(planta);
        const tieneFertilizanteLiquido = usaFertilizanteLiquido(planta);
        let proximaFertilizacionSeca = null;
        let proximaFertilizacionLiquida = null;

        if (tieneFertilizanteSeco) {
            proximaFertilizacionSeca = calcularSiguienteFecha(
                planta.fechaultimafertilizacion,
                planta.frecuenciafertilizante
            );
        }

        if (tieneFertilizanteLiquido) {
            proximaFertilizacionLiquida = calcularSiguienteFecha(
                planta.fechaultimafertilizacionliquida,
                planta.frecuenciafertilizanteliquido
            );
        }

        const estadoRiego = obtenerEstadoCuidado(proximoRiego, planta.frecuenciariego);
        const estadoFertilizacionSeca = tieneFertilizanteSeco
            ? obtenerEstadoCuidado(proximaFertilizacionSeca, planta.frecuenciafertilizante)
            : '';
        const estadoFertilizacionLiquida = tieneFertilizanteLiquido
            ? obtenerEstadoCuidado(proximaFertilizacionLiquida, planta.frecuenciafertilizanteliquido)
            : '';

        const nombreSeguro = escaparHTML(planta.nombre);
        const nombreCientificoSeguro = escaparHTML(planta.nombrecientifico);
        const ubicacionSegura = escaparHTML(planta.ubicacion || 'Ubicación sin indicar');
        const notasPreview = planta.notas ? escaparHTML(planta.notas.trim().slice(0, 110)) : 'Sin notas';
        const infoSol = obtenerInfoSol(planta.nivelsol);
        const ultimoRiegoTexto = formatearFechaGuardada(planta.fechaultimoriego);
        const ultimaFertilizacionSecaTexto = formatearFechaGuardada(planta.fechaultimafertilizacion);
        const ultimaFertilizacionLiquidaTexto = formatearFechaGuardada(planta.fechaultimafertilizacionliquida);
        const card = document.createElement('div');

        card.className = 'plant-card';

        card.innerHTML = `
            ${crearMosaicoFotos(planta, nombreSeguro)}
            <div class="plant-info">
                <h3 class="plant-name">${nombreSeguro}</h3>
                ${planta.nombrecientifico ? `<p class="scientific-name">${nombreCientificoSeguro}</p>` : ''}
                <p class="plant-location">📍 ${ubicacionSegura}</p>

                <div class="plant-details">
                    <div class="detail care-detail">
                        <span class="care-status-icon watering-icon ${estadoRiego}" aria-hidden="true"></span>
                        <strong>Siguiente riego</strong>
                        <span class="next-care-date" title="Ultimo riego: ${ultimoRiegoTexto}">${fechaAString(proximoRiego)}</span>
                    </div>

                    <div class="detail">
                        <strong>Frecuencia riego</strong>
                        <span>${planta.frecuenciariego} dias</span>
                    </div>

                    <div class="detail sunlight-detail ${infoSol.className}">
                        <span class="sunlight-dot" aria-hidden="true"></span>
                        <strong>Sol</strong>
                        <span>${infoSol.label}</span>
                    </div>

                    ${tieneFertilizanteSeco ? `
                    <div class="detail care-detail">
                        <span class="care-status-icon fertilizing-icon ${estadoFertilizacionSeca}" aria-hidden="true"></span>
                        <strong>Siguiente fertilizado seco</strong>
                        <span class="next-care-date" title="Ultimo seco: ${ultimaFertilizacionSecaTexto}">${fechaAString(proximaFertilizacionSeca)}</span>
                    </div>

                    <div class="detail">
                        <strong>Frecuencia seco</strong>
                        <span>${planta.frecuenciafertilizante} dias</span>
                    </div>
                    ` : ''}

                    ${tieneFertilizanteLiquido ? `
                    <div class="detail care-detail">
                        <span class="care-status-icon liquid-fertilizing-icon ${estadoFertilizacionLiquida}" aria-hidden="true"></span>
                        <strong>Siguiente fertilizante liquido</strong>
                        <span class="next-care-date" title="Ultimo liquido: ${ultimaFertilizacionLiquidaTexto}">${fechaAString(proximaFertilizacionLiquida)}</span>
                    </div>

                    <div class="detail">
                        <strong>Frecuencia liquido</strong>
                        <span>${planta.frecuenciafertilizanteliquido} dias</span>
                    </div>
                    ` : ''}
                </div>

                <div class="notes-preview ${planta.notas ? 'has-notes' : 'empty-notes'}">${notasPreview}</div>
                <p class="environment-advice plant-care-tip">${generarConsejoPersonalizado(planta)}</p>
                <div class="plant-actions">
                    <div class="plant-action-group">
                        <button class="care-done-btn" data-index="${index}" data-care="riego" type="button">Regué</button>
                        ${tieneFertilizanteSeco ? `<button class="care-done-btn" data-index="${index}" data-care="fertilizacion" type="button">Aboné</button>` : ''}
                        ${tieneFertilizanteLiquido ? `<button class="care-done-btn" data-index="${index}" data-care="fertilizacion_liquida" type="button">Fertilizante líquido</button>` : ''}
                        <button class="notes-btn" data-index="${index}" type="button" aria-label="Abrir notas de ${nombreSeguro}">📝</button>
                        <button class="edit-btn" data-index="${index}" type="button">Editar</button>
                        <button class="delete-btn" data-index="${index}" type="button">Eliminar</button>
                    </div>
                </div>
            </div>
        `;

        grillaPlantas.appendChild(card);
    });

    document.querySelectorAll('.care-done-btn').forEach(btn => btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.index);
        await marcarAccionRealizada(idx, btn.dataset.care, new Date());
    }));

    document.querySelectorAll('.notes-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.index, 10);
            abrirModalNotas(index);
        });
    });

document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {

        const index = parseInt(e.target.dataset.index, 10);
        const plantaId = plantas[index].id;

        if (!confirm(`¿Seguro que deseas eliminar "${plantas[index].nombre}"?`)) {
            return;
        }

        try {

            await pb.collection("plantas").delete(plantaId);

            plantas.splice(index, 1);

            renderizarVistasPrincipales();

            alert("Planta eliminada correctamente.");

        } catch (error) {

            console.error(error);

            if (!navigator.onLine || error.status === 0 || error.name === 'TypeError') {
                guardarEnColaOffline({ tipo: 'planta-eliminar', idLocal: plantaId, versionBase: plantas[index]?.updated });
                plantas.splice(index, 1);
                localStorage.setItem(claveLocal('suculenta-plantas-cache'), JSON.stringify(plantas));
                renderizarVistasPrincipales();
                alert('Eliminación pendiente; se sincronizará cuando vuelva la conexión.');
                return;
            }

            alert("No se pudo eliminar la planta.");

        }

    });
});
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            cargarFormularioEdicion(index);
        });
    });
}

// Dibuja la galeria y conecta el entrada de fotos de cada planta.
function renderizarGaleria() {
    galeriaGrid.innerHTML = '';

    if (plantas.length === 0) {
        galeriaGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">No hay plantas para mostrar en la galeria.</p>';
        return;
    }

    plantas.forEach((planta, index) => {
        const item = document.createElement('div');
        item.className = 'galeria-item';
        const nombreSeguro = escaparHTML(planta.nombre);
        const nombreCientificoSeguro = escaparHTML(planta.nombrecientifico);
        const fotosGaleria = normalizarFotosGaleria(planta.fotosgaleria);
        const cantidadFotos = fotosGaleria.length;
        const totalVisible = cantidadFotos || 1;
        item.innerHTML = `
            <div class="galeria-media">
                ${crearMosaicoFotos(planta, nombreSeguro, Math.max(totalVisible, 4), { eliminable: true, indicePlanta: index })}
            </div>
            <div class="galeria-info">
                <div>
                    <h4>${nombreSeguro}</h4>
                    ${planta.nombrecientifico ? `<p>${nombreCientificoSeguro}</p>` : ''}
                    <span>${cantidadFotos} foto${cantidadFotos === 1 ? '' : 's'} de galeria</span>
                </div>
                <label class="gallery-add-btn">
                    Agregar fotos
                    <input type="file" class="gallery-file-input" data-index="${index}" accept="image/*" multiple>
                </label>
            </div>
        `;
        galeriaGrid.appendChild(item);
    });

    document.querySelectorAll('.gallery-file-input').forEach(entrada => {
        entrada.addEventListener('change', manejarCargaFotosGaleria);
    });

    document.querySelectorAll('.gallery-delete-photo').forEach(boton => {
        boton.addEventListener('click', manejarEliminacionFotoGaleria);
    });
}

function renderizarVistasPrincipales() {
    renderizarPlantas();
    renderizarCalendario();
    renderizarGaleria();
    renderizarDiario();
    actualizarEstadoRecordatorios();
    revisarRecordatorios();
    document.getElementById('reminder-time').value = localStorage.getItem(claveLocal('suculenta-hora-recordatorio')) || '09:00';
    sincronizarRecordatoriosAndroid();
    actualizarEstadoSincronizacion();
}

async function manejarCargaFotosGaleria(e) {

    const entrada = e.target;
    const index = parseInt(entrada.dataset.index, 10);
    const planta = plantas[index];

    const archivos = Array.from(entrada.files || []);

    if (!planta || archivos.length === 0) return;

    try {
        if (!navigator.onLine) {
            const fotos = await Promise.all(archivos.map(comprimirFotoDiario));
            guardarEnColaOffline({ tipo: 'galeria-agregar', idLocal: planta.id, fotos, versionBase: planta.updated });
            planta.fotosgaleria = normalizarFotosGaleria(planta.fotosgaleria).concat(fotos);
            localStorage.setItem(claveLocal('suculenta-plantas-cache'), JSON.stringify(plantas));
            entrada.value = '';
            renderizarVistasPrincipales();
            alert('Fotos guardadas en este dispositivo; se subirán cuando vuelva la conexión.');
            return;
        }
        const formData = new FormData();
        archivos.forEach(archivo => formData.append("fotosgaleria", archivo));
        await pb.collection("plantas").update(planta.id, formData);

        entrada.value = "";

        await cargarPlantas();
        await procesarColaOffline();

        renderizarVistasPrincipales();

        alert("Fotos agregadas correctamente.");

    }  catch (error) {

    console.error(error);
    console.log(error.response);

    if (!navigator.onLine || error.status === 0 || error.name === 'TypeError') {
        try {
            const fotos = await Promise.all(archivos.map(comprimirFotoDiario));
            guardarEnColaOffline({ tipo: 'galeria-agregar', idLocal: planta.id, fotos, versionBase: planta.updated });
            planta.fotosgaleria = normalizarFotosGaleria(planta.fotosgaleria).concat(fotos);
            localStorage.setItem(claveLocal('suculenta-plantas-cache'), JSON.stringify(plantas));
            entrada.value = '';
            renderizarVistasPrincipales();
            alert('Fotos guardadas en este dispositivo; se subirán cuando vuelva la conexión.');
            return;
        } catch (offlineError) { alert(offlineError.message || 'No se pudo guardar el cambio sin conexión.'); return; }
    }
    alert(JSON.stringify(error.response, null, 2));

}

}

async function manejarEliminacionFotoGaleria(e) {

    e.stopPropagation();

    const indicePlanta = parseInt(e.currentTarget.dataset.indicePlanta, 10);
    const indiceFoto = parseInt(e.currentTarget.dataset.indiceFoto, 10);

    const planta = plantas[indicePlanta];

    const fotosActuales = normalizarFotosGaleria(planta?.fotosgaleria);

    if (!planta || !fotosActuales[indiceFoto]) return;

    if (!confirm("¿Eliminar esta foto de la galería?")) return;

    try {

        const fotoEliminada = fotosActuales[indiceFoto];
        await actualizarFotosGaleria(planta, fotosActuales.filter((_, i) => i !== indiceFoto), fotoEliminada);

    } catch (error) {

        console.error(error);

        alert("No se pudo eliminar la foto.");

    }

}

async function actualizarFotosGaleria(planta, fotosgaleria, fotoEliminada) {
    const localImage = fotoEliminada?.startsWith('data:');
    if (!navigator.onLine || localImage) {
        if (localImage) {
            const cola = leerColaOffline();
            const indexOp = cola.findIndex(op => op.tipo === 'galeria-agregar' && op.idLocal === planta.id && op.fotos.includes(fotoEliminada));
            if (indexOp >= 0) {
                cola[indexOp].fotos = cola[indexOp].fotos.filter(foto => foto !== fotoEliminada);
                if (!cola[indexOp].fotos.length) cola.splice(indexOp, 1);
                localStorage.setItem(claveLocal('suculenta-cola-offline'), JSON.stringify(cola));
            }
        } else {
            const nombreArchivo = decodeURIComponent(new URL(fotoEliminada, location.href).pathname.split('/').pop());
            guardarEnColaOffline({ tipo: 'galeria-eliminar', idLocal: planta.id, nombreArchivo, versionBase: planta.updated });
        }
        planta.fotosgaleria = fotosgaleria;
        localStorage.setItem(claveLocal('suculenta-plantas-cache'), JSON.stringify(plantas));
        renderizarVistasPrincipales();
        return;
    }
    const nombreArchivo = decodeURIComponent(new URL(fotoEliminada, location.href).pathname.split('/').pop());
    const formData = new FormData();
    formData.append('fotosgaleria-', nombreArchivo);
    try {
        await pb.collection('plantas').update(planta.id, formData);
    } catch (error) {
        if (!navigator.onLine || error.status === 0 || error.name === 'TypeError') {
            guardarEnColaOffline({ tipo: 'galeria-eliminar', idLocal: planta.id, nombreArchivo, versionBase: planta.updated });
            planta.fotosgaleria = fotosgaleria;
            localStorage.setItem(claveLocal('suculenta-plantas-cache'), JSON.stringify(plantas));
            renderizarVistasPrincipales();
            return;
        }
        throw error;
    }
    planta.fotosgaleria = fotosgaleria;
    localStorage.setItem(claveLocal('suculenta-plantas-cache'), JSON.stringify(plantas));
    renderizarVistasPrincipales();
}

// Dibuja el mes actual, marca dias con tareas y conecta la navegacion.
function renderizarCalendario() {
    const primerDiaMes = new Date(anioActual, mesActual, 1);
    let diaSemanaInicio = primerDiaMes.getDay() - 1;
    if (diaSemanaInicio < 0) diaSemanaInicio = 6;
    const dias = obtenerDiasDelMes(anioActual, mesActual);

    contenedorCalendario.innerHTML = `
        <div class="calendar-header">
            <h3>${MESES[mesActual]} ${anioActual}</h3>
            <div class="calendar-nav">
                <button id="prev-month" type="button">← Anterior</button>
                <button id="today" type="button">Hoy</button>
                <button id="next-month" type="button">Siguiente →</button>
            </div>
        </div>
        <div class="calendar-grid">
            ${DIAS_SEMANA.map(dia => `<div class="day-name">${dia}</div>`).join('')}
            ${Array(diaSemanaInicio).fill('<div class="day"></div>').join('')}
            ${dias.map(fecha => {
                const marcaciones = obtenerMarcacionesDia(fecha);
                const esHoy = fecha.toDateString() === new Date().toDateString();
                const clases = ['day'];
                if (esHoy) clases.push('today');
                const tieneFertilizante = marcaciones.fertilizacion || marcaciones.fertilizacionLiquida;
                if (marcaciones.riego && tieneFertilizante) clases.push('both');
                else if (marcaciones.riego) clases.push('watering');
                else if (tieneFertilizante) clases.push('fertilizing');
                if (marcaciones.fertilizacionLiquida) clases.push('liquid-fertilizing');
                const iconos = [];
                if (marcaciones.riego) iconos.push('<img src="img/regar.png" alt="Riego" class="day-icon">');
                if (marcaciones.fertilizacion) iconos.push('<img src="img/abonar.png" alt="Seco" class="day-icon">');
                if (marcaciones.fertilizacionLiquida) iconos.push('<span class="day-icon liquid-day-icon" title="Fertilizante liquido">L</span>');
                const etiquetas = [];
                if (marcaciones.riego) etiquetas.push('Riego');
                if (marcaciones.fertilizacion) etiquetas.push('Seco');
                if (marcaciones.fertilizacionLiquida) etiquetas.push('Liquido');
                const etiqueta = etiquetas.join(' + ');
                return `
                    <div class="${clases.join(' ')}" data-date="${fechaAString(fecha)}">
                        <div class="day-number">${fecha.getDate()}</div>
                        <div class="day-icons">${iconos.join('')}</div>
                        <div class="day-label">${etiqueta}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    document.getElementById('prev-month').addEventListener('click', () => {
        mesActual--;
        if (mesActual < 0) {
            mesActual = 11;
            anioActual--;
        }
        renderizarCalendario();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        mesActual++;
        if (mesActual > 11) {
            mesActual = 0;
            anioActual++;
        }
        renderizarCalendario();
    });

    document.getElementById('today').addEventListener('click', () => {
        const hoy = new Date();
        mesActual = hoy.getMonth();
        anioActual = hoy.getFullYear();
        renderizarCalendario();
    });

    contenedorCalendario.querySelectorAll('.day[data-date]').forEach(day => {
        day.addEventListener('click', () => {
            mostrarModalDia(parsearFechaYMD(day.dataset.date));
        });
    });
}

// Activa una pestana y oculta las demas secciones.
function cambiarPestana(tabId) {
    secciones.forEach(section => section.classList.remove('active'));
    botonesPestana.forEach(btn => btn.classList.remove('active'));
    const targetSection = document.getElementById(`${tabId}-section`);
    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetSection) targetSection.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
    if (tabId === 'diario') renderizarDiario();
}

function sincronizarFertilizanteCheckbox(checkbox, entrada) {
    if (!checkbox || !entrada) return;

    if (checkbox.checked) {
        entrada.disabled = true;
        entrada.value = '';
    } else {
        entrada.disabled = false;
        if (!entrada.value) entrada.value = '30';
    }
}

// Resetea el formulario para volver al modo "agregar planta".
function limpiarFormulario() {
    indiceEdicionActual = null;
    formularioPlanta.reset();
    document.getElementById('plant-notes').value = '';
    inputArchivoImagen.value = '';
    imagenVistaPrevia.src = IMAGEN_PREDETERMINADA;
    imagenVistaPrevia.classList.add('broken-image');
    vistaPreviaImagen.style.display = 'none';
    seleccionarNivelSolFormulario(NIVEL_SOL_PREDETERMINADO);
    document.getElementById('plant-location').value = '';
    document.getElementById('plant-reminder-water').checked = true;
    document.getElementById('plant-reminder-fertilizer').checked = true;
    document.getElementById('plant-reminder-time').value = '09:00';
    casillaSinFertilizanteSeco.checked = false;
    casillaSinFertilizanteLiquido.checked = false;
    sincronizarFertilizanteCheckbox(casillaSinFertilizanteSeco, document.getElementById('fertilizing-frequency'));
    sincronizarFertilizanteCheckbox(casillaSinFertilizanteLiquido, document.getElementById('liquid-fertilizing-frequency'));
    tituloFormulario.textContent = 'Añadir nueva planta';
    botonEnviar.textContent = 'Guardar planta';
    botonCancelarEdicion.classList.add('hidden');
}

// Carga una planta existente en el formulario para editarla.
function cargarFormularioEdicion(index) {
    const planta = plantas[index];
    if (!planta) return;

    indiceEdicionActual = index;
    tituloFormulario.textContent = 'Editar planta';
    botonEnviar.textContent = 'Guardar cambios';
    botonCancelarEdicion.classList.remove('hidden');
    document.getElementById('plant-name').value = planta.nombre;
    document.getElementById('plant-scientific-name').value = planta.nombrecientifico || '';
    document.getElementById('plant-location').value = planta.ubicacion || '';
    document.getElementById('plant-reminder-water').checked = planta.avisoriego !== false;
    document.getElementById('plant-reminder-fertilizer').checked = planta.avisoabono !== false;
    document.getElementById('plant-reminder-time').value = planta.horaaviso || '09:00';
    document.getElementById('plant-notes').value = planta.notas || '';
    document.getElementById('watering-frequency').value = planta.frecuenciariego;
    seleccionarNivelSolFormulario(planta.nivelsol);

    const noFertiliza = planta.frecuenciafertilizante === null;
    const noFertilizaLiquido = planta.frecuenciafertilizanteliquido === null;
    const fertilizingInput = document.getElementById('fertilizing-frequency');
    const liquidFertilizingInput = document.getElementById('liquid-fertilizing-frequency');
    casillaSinFertilizanteSeco.checked = noFertiliza;
    casillaSinFertilizanteLiquido.checked = noFertilizaLiquido;
    fertilizingInput.value = noFertiliza ? '' : planta.frecuenciafertilizante;
    liquidFertilizingInput.value = noFertilizaLiquido ? '' : planta.frecuenciafertilizanteliquido;
    sincronizarFertilizanteCheckbox(casillaSinFertilizanteSeco, fertilizingInput);
    sincronizarFertilizanteCheckbox(casillaSinFertilizanteLiquido, liquidFertilizingInput);

    imagenVistaPrevia.src = planta.imagen || IMAGEN_PREDETERMINADA;
    if (planta.imagen) {
        imagenVistaPrevia.classList.remove('broken-image');
        vistaPreviaImagen.style.display = 'block';
    } else {
        imagenVistaPrevia.classList.add('broken-image');
        vistaPreviaImagen.style.display = 'none';
    }
    inputArchivoImagen.value = '';
    cambiarPestana('control');
}

// Abre el modal de un dia con tareas programadas y registro manual.
function obtenerTextoTipoActividad(tipo) {
    const textos = {
        riego: 'Riego',
        fertilizacion: 'Fertilizado seco',
        fertilizacion_liquida: 'Fertilizante liquido'
    };
    return textos[tipo] || tipo;
}

function obtenerTextoTiposActividad(tipos) {
    return tipos.map(obtenerTextoTipoActividad).join(' + ');
}

function crearBotonActividad(index, tipo, fecha, texto) {
    const boton = document.createElement('button');
    boton.className = 'task-btn';
    boton.type = 'button';
    boton.textContent = texto || `${obtenerTextoTipoActividad(tipo)} listo`;
    boton.addEventListener('click', () => {
        marcarAccionRealizada(parseInt(index, 10), tipo, fecha);
    });
    return boton;
}

function obtenerActividadesManualesPlanta(planta) {
    const actividades = [{ tipo: 'riego', texto: 'Registrar riego' }];

    if (usaFertilizanteSeco(planta)) {
        actividades.push({ tipo: 'fertilizacion', texto: 'Registrar seco' });
    }
    if (usaFertilizanteLiquido(planta)) {
        actividades.push({ tipo: 'fertilizacion_liquida', texto: 'Registrar liquido' });
    }
    if (usaFertilizanteSeco(planta) && usaFertilizanteLiquido(planta)) {
        actividades.push({ tipo: 'fertilizantes', texto: 'Registrar ambos fertilizantes' });
    }
    if (usaFertilizanteSeco(planta) || usaFertilizanteLiquido(planta)) {
        actividades.push({ tipo: 'todo', texto: 'Registrar todo' });
    }

    return actividades;
}

// Abre el modal de un dia con tareas programadas y registro manual.
function mostrarModalDia(fecha) {
    const fechaTexto = new Intl.DateTimeFormat('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(fecha);
    tituloModal.textContent = `Actividades para el ${fechaTexto}`;
    cuerpoModal.innerHTML = '';

    const tareas = obtenerPlantasParaFecha(fecha);
    if (plantas.length === 0) {
        cuerpoModal.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Aun no hay plantas cargadas.</p>';
    } else {
        if (tareas.length === 0) {
            cuerpoModal.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-bottom: 1rem;">No hay tareas programadas para este dia. Puedes registrar una actividad manualmente.</p>';
        }

        const plantasMap = {};
        tareas.forEach(tarea => {
            if (!plantasMap[tarea.index]) {
                plantasMap[tarea.index] = { planta: tarea.planta, tipos: [] };
            }
            plantasMap[tarea.index].tipos.push(tarea.tipo);
        });

        Object.entries(plantasMap).forEach(([index, data]) => {
            const item = document.createElement('div');
            item.className = 'task-card';
            item.innerHTML = `
                <div>
                    <h4>${escaparHTML(data.planta.nombre)}</h4>
                    <p>Tipo: ${obtenerTextoTiposActividad(data.tipos)}</p>
                    <p>Programado para: ${fechaAString(fecha)}</p>
                </div>
            `;

            const grupoBotones = document.createElement('div');
            grupoBotones.className = 'task-actions';

            data.tipos.forEach(tipo => {
                grupoBotones.appendChild(crearBotonActividad(index, tipo, fecha));
            });

            if (data.tipos.length > 1) {
                const todosBtn = document.createElement('button');
                todosBtn.className = 'task-btn task-btn-success';
                todosBtn.type = 'button';
                todosBtn.textContent = 'Registrar pendientes';
                todosBtn.addEventListener('click', () => {
                    marcarAccionRealizada(parseInt(index, 10), data.tipos, fecha);
                });
                grupoBotones.appendChild(todosBtn);
            }

            item.appendChild(grupoBotones);
            cuerpoModal.appendChild(item);
        });

        const registroManual = document.createElement('div');
        registroManual.className = 'task-card task-card-manual';
        registroManual.innerHTML = `
            <div>
                <h4>Registrar actividad manual</h4>
                <p>Elige una planta y marca solo las actividades que usa.</p>
            </div>
        `;

        const plantaSelect = document.createElement('select');
        plantaSelect.className = 'task-select';
        plantaSelect.innerHTML = plantas.map((planta, index) => `<option value="${index}">${escaparHTML(planta.nombre)}</option>`).join('');

        const accionesManuales = document.createElement('div');
        accionesManuales.className = 'task-actions manual-actions';

        function renderizarBotonesManuales() {
            const index = parseInt(plantaSelect.value, 10);
            const planta = plantas[index];
            accionesManuales.innerHTML = '';
            obtenerActividadesManualesPlanta(planta).forEach(({ tipo, texto }) => {
                const boton = document.createElement('button');
                boton.className = tipo === 'todo' || tipo === 'fertilizantes' ? 'task-btn task-btn-success' : 'task-btn';
                boton.type = 'button';
                boton.textContent = texto;
                boton.addEventListener('click', () => {
                    marcarAccionRealizada(index, tipo, fecha);
                });
                accionesManuales.appendChild(boton);
            });
        }

        plantaSelect.addEventListener('change', renderizarBotonesManuales);

        const controles = document.createElement('div');
        controles.className = 'manual-task-controls';
        controles.appendChild(plantaSelect);
        controles.appendChild(accionesManuales);
        registroManual.appendChild(controles);
        cuerpoModal.appendChild(registroManual);
        renderizarBotonesManuales();
    }

    modalDia.classList.remove('hidden');
}

// Cierra el modal del calendario.
function cerrarModalDia() {
    modalDia.classList.add('hidden');
}

function abrirModalNotas(index) {
    const planta = plantas[index];
    if (!planta) return;

    tituloModalNotas.textContent = `Notas de ${planta.nombre}`;
    cuerpoModalNotas.innerHTML = `
        <textarea id="notes-editor" class="notes-editor" rows="10" aria-label="Notas de la planta">${escaparHTML(planta.notas || '')}</textarea>
        <div class="notes-modal-actions">
            <button type="button" class="save-notes-btn" data-index="${index}">Guardar notas</button>
        </div>
    `;

    const botonGuardarNotas = cuerpoModalNotas.querySelector('.save-notes-btn');
    botonGuardarNotas.addEventListener('click', async () => {
        const editor = cuerpoModalNotas.querySelector('#notes-editor');
        await guardarNotasPlanta(index, editor.value);
    });

    modalNotas.classList.remove('hidden');
}

function cerrarModalNotas() {
    modalNotas.classList.add('hidden');
}

async function guardarNotasPlanta(index, texto) {
    const planta = plantas[index];
    if (!planta) return;

    const notas = String(texto ?? '');

    try {
        const actualizado = await pb.collection('plantas').update(planta.id, { notas });
        planta.notas = notas;
        planta.updated = actualizado.updated;
        renderizarVistasPrincipales();
        cerrarModalNotas();
    } catch (error) {
        console.error(error);
        if (!navigator.onLine || error.status === 0 || error.name === 'TypeError') {
            guardarEnColaOffline({ tipo: 'planta-notas', idLocal: planta.id, notas, versionBase: planta.updated });
            planta.notas = notas;
            localStorage.setItem(claveLocal('suculenta-plantas-cache'), JSON.stringify(plantas));
            renderizarVistasPrincipales();
            cerrarModalNotas();
            alert('Nota guardada en este dispositivo; se sincronizará al volver la conexión.');
            return;
        }
        alert('No se pudo guardar la nota.');
    }
}

async function encolarFormularioPlanta(indice) {
    const plantaActual = indice === null ? null : plantas[indice];
    if (indice !== null && !plantaActual) throw new Error('No se encontró la planta a editar.');
    const datos = {
        nombre: document.getElementById('plant-name').value.trim(),
        nombrecientifico: document.getElementById('plant-scientific-name').value.trim(),
        ubicacion: document.getElementById('plant-location').value.trim(),
        notas: document.getElementById('plant-notes').value,
        nivelsol: obtenerNivelSolFormulario(),
        frecuenciariego: document.getElementById('watering-frequency').value,
        avisoriego: String(document.getElementById('plant-reminder-water').checked),
        avisoabono: String(document.getElementById('plant-reminder-fertilizer').checked),
        horaaviso: document.getElementById('plant-reminder-time').value || '09:00'
    };
    const fertilizerDry = casillaSinFertilizanteSeco.checked ? null : document.getElementById('fertilizing-frequency').value;
    const fertilizerLiquid = casillaSinFertilizanteLiquido.checked ? null : document.getElementById('liquid-fertilizing-frequency').value;
    datos.frecuenciafertilizante = fertilizerDry ?? '';
    datos.frecuenciafertilizanteliquida = fertilizerLiquid ?? '';
    if (plantaActual) {
        datos.fechaultimoriego = plantaActual.fechaultimoriego;
        if (plantaActual.fechaultimafertilizacion) datos.fechaultimafertilizacion = plantaActual.fechaultimafertilizacion;
        if (plantaActual.fechaultimafertilizacionliquida) datos.fechaultimafertilizacionliquida = plantaActual.fechaultimafertilizacionliquida;
    } else {
        const ahora = new Date().toISOString();
        datos.fechaultimoriego = ahora;
        if (fertilizerDry !== null) datos.fechaultimafertilizacion = ahora;
        if (fertilizerLiquid !== null) datos.fechaultimafertilizacionliquida = ahora;
    }
    const file = inputArchivoImagen.files[0];
    const foto = file ? await comprimirFotoDiario(file) : null;
    const idLocal = plantaActual?.id || `local-${crypto.randomUUID()}`;
    guardarEnColaOffline({ tipo: 'planta-guardar', nueva: !plantaActual, idLocal, datos, foto, nombreArchivo: file?.name || 'planta.jpg', versionBase: plantaActual?.updated });
    if (plantaActual) Object.assign(plantaActual, datos, foto ? { imagen: foto } : {});
    else plantas.unshift(normalizarPlanta({ id: idLocal, ...datos, imagen: foto || IMAGEN_PREDETERMINADA, fechacreacion: new Date().toISOString() }));
    localStorage.setItem(claveLocal('suculenta-plantas-cache'), JSON.stringify(plantas));
}

// Guarda que una actividad fue realizada en la fecha elegida.
async function marcarAccionRealizada(index, tipo, fecha) {

    const planta = plantas[index];
    if (!planta) return;

    const fechaISO = fecha.toISOString();

    const cambios = {};

    const tipos = Array.isArray(tipo) ? tipo : [tipo];

    const registrarRiego =
        tipos.includes('riego') ||
        tipos.includes('ambas') ||
        tipos.includes('todo');

    const registrarSeco =
        tipos.includes('fertilizacion') ||
        tipos.includes('ambas') ||
        tipos.includes('fertilizantes') ||
        tipos.includes('todo');

    const registrarLiquido =
        tipos.includes('fertilizacion_liquida') ||
        tipos.includes('fertilizantes') ||
        tipos.includes('todo');
    const eventos = [];

    if (registrarRiego) {
        planta.fechaultimoriego = fechaISO;
        cambios.fechaultimoriego = fechaISO;
        eventos.push('riego');
    }

    if (registrarSeco && usaFertilizanteSeco(planta)) {
        planta.fechaultimafertilizacion = fechaISO;
        cambios.fechaultimafertilizacion = fechaISO;
        eventos.push('fertilizacion');
    }

    if (registrarLiquido && usaFertilizanteLiquido(planta)) {
        planta.fechaultimafertilizacionliquida = fechaISO;
        cambios.fechaultimafertilizacionliquida = fechaISO;
        eventos.push('fertilizacion_liquida');
    }

    if (Object.keys(cambios).length === 0) return;

    try {

        const actualizado = await pb.collection("plantas").update(
            planta.id,
            cambios
        );
        planta.updated = actualizado.updated;
        for (const tipoCuidado of eventos) {
            const registro = await pb.collection('cuidados').create({ user: usuarioActual.id, planta: planta.id, tipo: tipoCuidado, fecha: fechaISO, nota: '' });
            registrosCuidado.unshift(registro);
        }
        localStorage.setItem(claveLocal('suculenta-cuidados-cache'), JSON.stringify(registrosCuidado));

        renderizarVistasPrincipales();

        mostrarModalDia(fecha);

    } catch (error) {

        console.error(error);
        if (!navigator.onLine || error.status === 0 || error.name === 'TypeError') {
            eventos.forEach(tipoCuidado => guardarEnColaOffline({ tipo: 'cuidado', plantaId: planta.id, tipoCuidado, fecha: fechaISO, cambios, versionBase: planta.updated }));
            mezclarCuidadosPendientes();
            localStorage.setItem(claveLocal('suculenta-cuidados-cache'), JSON.stringify(registrosCuidado));
            localStorage.setItem(claveLocal('suculenta-plantas-cache'), JSON.stringify(plantas));
            renderizarVistasPrincipales();
            alert('Cuidado guardado en este dispositivo; se sincronizará cuando vuelva la conexión.');
            return;
        }
        alert("No se pudo registrar la acción.");

    }

}

async function manejarEnvioFormulario(e) {

    e.preventDefault();

    const nombre = document.getElementById("plant-name").value.trim();
    const nombreCientifico = document.getElementById("plant-scientific-name").value.trim();
    const notas = document.getElementById("plant-notes").value;
    const frecuenciaRiego = parseInt(document.getElementById("watering-frequency").value, 10);

    const nivelsol = obtenerNivelSolFormulario();

    const noFertiliza = casillaSinFertilizanteSeco.checked;
    const noFertilizaLiquido = casillaSinFertilizanteLiquido.checked;

    let frecuenciaFertilizante = null;
    let frecuenciaFertilizanteLiquido = null;

    if (!nombre) {
        alert("Ingresa el nombre de la planta.");
        return;
    }

    if (isNaN(frecuenciaRiego) || frecuenciaRiego < 1) {
        alert("La frecuencia de riego debe ser mayor que 0.");
        return;
    }

    if (!noFertiliza) {

        frecuenciaFertilizante = parseInt(
            document.getElementById("fertilizing-frequency").value,
            10
        );

        if (isNaN(frecuenciaFertilizante) || frecuenciaFertilizante < 1) {
            alert("Frecuencia de fertilizado inválida.");
            return;
        }

    }

    if (!noFertilizaLiquido) {

        frecuenciaFertilizanteLiquido = parseInt(
            document.getElementById("liquid-fertilizing-frequency").value,
            10
        );

        if (
            isNaN(frecuenciaFertilizanteLiquido) ||
            frecuenciaFertilizanteLiquido < 1
        ) {
            alert("Frecuencia de fertilizante líquido inválida.");
            return;
        }

    }

    try {

        const formData = new FormData();

        formData.append("nombre", nombre);
        formData.append("nombrecientifico", nombreCientifico);
        formData.append("ubicacion", document.getElementById('plant-location').value.trim());
        formData.append("avisoriego", String(document.getElementById('plant-reminder-water').checked));
        formData.append("avisoabono", String(document.getElementById('plant-reminder-fertilizer').checked));
        formData.append("horaaviso", document.getElementById('plant-reminder-time').value || '09:00');
        formData.append("notas", notas);
        formData.append("nivelsol", nivelsol);

        formData.append("frecuenciariego", frecuenciaRiego);

        if (frecuenciaFertilizante !== null)
            formData.append("frecuenciafertilizante", frecuenciaFertilizante);

        if (frecuenciaFertilizanteLiquido !== null)
            formData.append("frecuenciafertilizanteliquido", frecuenciaFertilizanteLiquido);

        const archivo = inputArchivoImagen.files[0];

        if (archivo) {
            formData.append("imagen", archivo);
        }

        if (indiceEdicionActual !== null) {

            const planta = plantas[indiceEdicionActual];

            formData.append("fechaultimoriego", planta.fechaultimoriego);

            if (planta.fechaultimafertilizacion)
                formData.append(
                    "fechaultimafertilizacion",
                    planta.fechaultimafertilizacion
                );

            if (planta.fechaultimafertilizacionliquida)
                formData.append(
                    "fechaultimafertilizacionliquida",
                    planta.fechaultimafertilizacionliquida
                );

            await pb.collection("plantas").update(
                planta.id,
                formData
            );

            alert("Planta actualizada.");

        } else {

            formData.append("user", usuarioActual.id);

            const ahora = new Date().toISOString();

            formData.append("fechaultimoriego", ahora);

            if (frecuenciaFertilizante !== null)
                formData.append(
                    "fechaultimafertilizacion",
                    ahora
                );

            if (frecuenciaFertilizanteLiquido !== null)
                formData.append(
                    "fechaultimafertilizacionliquida",
                    ahora
                );

            await pb.collection("plantas").create(
                formData
            );

            alert("Planta agregada.");

        }

        await cargarPlantas();

        limpiarFormulario();

        renderizarVistasPrincipales();

    }  catch (error) {

    console.error(error);
    console.log(error.response);
    if (!navigator.onLine || error.status === 0 || error.name === 'TypeError') {
        try {
            await encolarFormularioPlanta(indiceEdicionActual);
            limpiarFormulario();
            renderizarVistasPrincipales();
            alert('Guardé el cambio en este dispositivo; se sincronizará cuando vuelva la conexión.');
            return;
        } catch (offlineError) { alert(offlineError.message || 'No se pudo guardar la planta sin conexión.'); return; }
    }
    alert(JSON.stringify(error.response, null, 2));
}

}


// Diario, mediciones ambientales, identificación y recordatorios locales.
function claveLocal(sufijo) {
    return `${sufijo}:${usuarioActual?.id || 'anonimo'}`;
}

function leerRegistrosLocales(sufijo) {
    try { return JSON.parse(localStorage.getItem(claveLocal(sufijo)) || '{}'); }
    catch (error) { return {}; }
}

function guardarRegistrosLocales(sufijo, datos) {
    localStorage.setItem(claveLocal(sufijo), JSON.stringify(datos));
}

function leerColaOffline() {
    try { return JSON.parse(localStorage.getItem(claveLocal('suculenta-cola-offline')) || '[]'); }
    catch (error) { return []; }
}

function guardarEnColaOffline(operacion) {
    const cola = leerColaOffline();
    const nuevaCola = [...cola, { ...operacion, queuedAt: new Date().toISOString() }];
    const serializada = JSON.stringify(nuevaCola);
    if (serializada.length > 1700000) throw new Error('La cola local está casi llena. Conéctate para sincronizar antes de guardar más fotos sin conexión.');
    localStorage.setItem(claveLocal('suculenta-cola-offline'), serializada);
    actualizarEstadoSincronizacion();
}

function archivoDesdeDataURL(dataURL, nombre) {
    const [cabecera, datos] = dataURL.split(',');
    const tipo = cabecera.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
    const binario = atob(datos);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return new File([bytes], nombre || 'foto.jpg', { type: tipo });
}

function datosDesdeFormData(formData) {
    const datos = {};
    for (const [clave, valor] of formData.entries()) {
        if (valor instanceof File) continue;
        datos[clave] = valor;
    }
    return datos;
}

function actualizarEstadoSincronizacion() {
    const pendientes = leerColaOffline().length;
    let aviso = document.getElementById('sync-status');
    if (!aviso) {
        aviso = document.createElement('p');
        aviso.id = 'sync-status';
        aviso.className = 'sync-status';
        document.querySelector('.plants-section .plant-tools')?.before(aviso);
    }
    if (aviso) aviso.textContent = pendientes ? `${pendientes} cambio${pendientes === 1 ? '' : 's'} pendiente${pendientes === 1 ? '' : 's'} de sincronizar${navigator.onLine ? '…' : ' · sin conexión'}` : (navigator.onLine ? 'Todo sincronizado' : 'Sin conexión · se muestran los datos guardados');
}

async function procesarColaOffline() {
    if (!navigator.onLine || !usuarioActual) return;
    let cola = leerColaOffline();
    if (!cola.length) { actualizarEstadoSincronizacion(); return; }
    const idsLocales = JSON.parse(localStorage.getItem(claveLocal('suculenta-ids-sincronizados')) || '{}');
    const pendientes = [];
    const modificadosEnEstaCola = new Set();
    const comprobarConflicto = async (idLocal, idRemoto, versionBase) => {
        if (!versionBase || modificadosEnEstaCola.has(idLocal)) return true;
        const remoto = await pb.collection('plantas').getOne(idRemoto);
        if (!remoto.updated || remoto.updated === versionBase) return true;
        return confirm(`“${remoto.nombre}” cambió en otro dispositivo desde que guardaste sin conexión. Aceptar conserva esta versión; Cancelar descarta este cambio pendiente y carga la versión del servidor.`);
    };
    for (let indice = 0; indice < cola.length; indice++) {
        const op = cola[indice];
        try {
            if (op.tipo === 'planta-guardar') {
                const fd = new FormData();
                Object.entries(op.datos).forEach(([k, v]) => fd.append(k, v));
                if (op.foto) fd.append('imagen', archivoDesdeDataURL(op.foto, op.nombreArchivo));
                let registro;
                if (op.nueva) {
                    fd.append('user', usuarioActual.id);
                    registro = await pb.collection('plantas').create(fd);
                    idsLocales[op.idLocal] = registro.id;
                    modificadosEnEstaCola.add(op.idLocal);
                } else {
                    const id = idsLocales[op.idLocal] || op.idLocal;
                    if (!await comprobarConflicto(op.idLocal, id, op.versionBase)) continue;
                    registro = await pb.collection('plantas').update(id, fd);
                    modificadosEnEstaCola.add(op.idLocal);
                }
            } else if (op.tipo === 'planta-eliminar') {
                const remoteId = idsLocales[op.idLocal] || op.idLocal;
                if (!await comprobarConflicto(op.idLocal, remoteId, op.versionBase)) continue;
                await pb.collection('plantas').delete(remoteId);
                delete idsLocales[op.idLocal];
            } else if (op.tipo === 'planta-notas') {
                const remoteId = idsLocales[op.idLocal] || op.idLocal;
                if (!await comprobarConflicto(op.idLocal, remoteId, op.versionBase)) continue;
                await pb.collection('plantas').update(remoteId, { notas: op.notas });
                modificadosEnEstaCola.add(op.idLocal);
            } else if (op.tipo === 'galeria-agregar') {
                const remoteId = idsLocales[op.idLocal] || op.idLocal;
                if (!await comprobarConflicto(op.idLocal, remoteId, op.versionBase)) continue;
                const fd = new FormData();
                (op.fotos || []).forEach((foto, i) => fd.append('fotosgaleria', archivoDesdeDataURL(foto, `galeria-${i + 1}.jpg`)));
                await pb.collection('plantas').update(remoteId, fd);
                modificadosEnEstaCola.add(op.idLocal);
            } else if (op.tipo === 'galeria-eliminar') {
                const remoteId = idsLocales[op.idLocal] || op.idLocal;
                if (!await comprobarConflicto(op.idLocal, remoteId, op.versionBase)) continue;
                const fd = new FormData();
                fd.append('fotosgaleria-', op.nombreArchivo);
                await pb.collection('plantas').update(remoteId, fd);
                modificadosEnEstaCola.add(op.idLocal);
            } else if (op.tipo === 'cuidado') {
                const plantaId = idsLocales[op.plantaId] || op.plantaId;
                if (!await comprobarConflicto(op.plantaId, plantaId, op.versionBase)) continue;
                await pb.collection('plantas').update(plantaId, op.cambios);
                modificadosEnEstaCola.add(op.plantaId);
                await pb.collection('cuidados').create({ user: usuarioActual.id, planta: plantaId, tipo: op.tipoCuidado, fecha: op.fecha, nota: op.nota || '' });
            } else if (op.tipo === 'diario-crear') {
                const plantaId = idsLocales[op.plantaId] || op.plantaId;
                const fd = new FormData();
                fd.append('user', usuarioActual.id);
                fd.append('planta', plantaId);
                fd.append('fecha', op.fecha);
                fd.append('texto', op.texto);
                if (op.foto) fd.append('foto', archivoDesdeDataURL(op.foto, op.nombreArchivo));
                await pb.collection('diario').create(fd);
            } else if (op.tipo === 'diario-eliminar') {
                await pb.collection('diario').delete(op.id);
            } else if (op.tipo === 'ambiente') {
                const registro = { user: usuarioActual.id, planta: idsLocales[op.plantaId] || op.plantaId, fecha: op.fecha };
                if (op.temperatura !== null && op.temperatura !== undefined) registro.temperatura = op.temperatura;
                if (op.humedad !== null && op.humedad !== undefined) registro.humedad = op.humedad;
                const registroGuardado = await pb.collection('mediciones_ambiente').create(registro);
                medicionesAmbiente.unshift(registroGuardado);
                localStorage.setItem(claveLocal('suculenta-ambiente-cache'), JSON.stringify(medicionesAmbiente));
            }
        } catch (error) {
            console.warn('La sincronización quedó pendiente.', error);
            pendientes.push(...cola.slice(indice));
            break;
        }
    }
    localStorage.setItem(claveLocal('suculenta-ids-sincronizados'), JSON.stringify(idsLocales));
    localStorage.setItem(claveLocal('suculenta-cola-offline'), JSON.stringify(pendientes));
    if (!pendientes.length) {
        await cargarPlantas();
        renderizarVistasPrincipales();
    }
    actualizarEstadoSincronizacion();
}

window.addEventListener('online', procesarColaOffline);
window.addEventListener('offline', actualizarEstadoSincronizacion);

function renderizarDiario() {
    const contenedor = document.getElementById('diary-content');
    if (!contenedor) return;
    if (!plantas.length) {
        contenedor.innerHTML = '<p class="empty-state">Agrega una planta para llevar su diario.</p>';
        return;
    }
    const ambiente = leerRegistrosLocales('suculenta-ambiente');
    contenedor.innerHTML = plantas.map((planta, index) => {
        const entradas = diarioNube.filter(entrada => entrada.planta === planta.id || entrada.plantaId === planta.id);
        const medicion = ambiente[planta.id] || {};
        const cuidados = registrosCuidado.filter(registro => (registro.planta === planta.id || registro.plantaId === planta.id)).slice(0, 12);
        return `<article class="diary-plant-card">
            <h3>${escaparHTML(planta.nombre)}</h3>
            <p class="plant-location">${escaparHTML(planta.nombrecientifico || 'Especie sin identificar')} · 📍 ${escaparHTML(planta.ubicacion || 'Ubicación sin indicar')} · ${escaparHTML(obtenerInfoSol(planta.nivelsol).label)}</p>
            <form class="environment-form" data-plant-index="${index}">
                <h4>Condiciones actuales</h4>
                <label>Temperatura (°C)<input name="temperature" type="number" step="0.1" min="-20" max="60" value="${escaparHTML(medicion.temperature ?? '')}" placeholder="Ej. 22"></label>
                <label>Humedad ambiental (%)<input name="humidity" type="number" step="1" min="0" max="100" value="${escaparHTML(medicion.humidity ?? '')}" placeholder="Ej. 45"></label>
                <button type="submit" class="secondary-btn">Guardar medición</button>
            </form>
            <p class="environment-advice">${generarConsejoAmbiente(planta, medicion)}</p>
            <form class="diary-form" data-plant-index="${index}">
                <h4>Registrar crecimiento o cuidado</h4>
                <textarea name="entry" rows="3" maxlength="1200" required placeholder="Describe cambios, brotes, floración o cuidados..."></textarea>
                <label>Foto (opcional)<input name="photo" type="file" accept="image/*"></label>
                <button type="submit">Guardar entrada</button>
            </form>
            <h4>Historial de cuidados</h4>
            <div class="care-history">${cuidados.length ? cuidados.map(c => `<p><time>${escaparHTML(formatearFechaGuardada(c.fecha))}</time> · ${escaparHTML(obtenerTextoTipoActividad(c.tipo))}${c.pending ? ' · pendiente de sincronizar' : ''}${c.nota ? ` · ${escaparHTML(c.nota)}` : ''}</p>`).join('') : '<p class="empty-state">Todavía no hay cuidados registrados.</p>'}</div>
            <div class="diary-entries">${entradas.length ? entradas.map((entrada, entryIndex) => `<article class="diary-entry">
                <time>${escaparHTML(formatearFechaGuardada(entrada.fecha || entrada.date))}</time>${entrada.pending ? '<small> · pendiente de sincronizar</small>' : ''}<p>${escaparHTML(entrada.texto ?? entrada.text ?? '')}</p>
                ${obtenerFotoDiarioURL(entrada) ? `<button class="diary-photo-button" type="button" data-record-id="${escaparHTML(entrada.id)}"><img src="${escaparHTML(obtenerFotoDiarioURL(entrada))}" alt="Foto del diario de ${escaparHTML(planta.nombre)}"></button>` : ''}
                <button class="diary-delete-button" type="button" data-record-id="${escaparHTML(entrada.id)}" data-plant-id="${escaparHTML(planta.id)}" data-entry-index="${entryIndex}">Eliminar entrada</button>
            </article>`).join('') : '<p class="empty-state">Todavía no hay entradas.</p>'}</div>
        </article>`;
    }).join('');

    contenedor.querySelectorAll('.environment-form').forEach(form => form.addEventListener('submit', async e => {
        e.preventDefault();
        const planta = plantas[Number(form.dataset.plantIndex)];
        const temperature = form.elements.temperature.value;
        const humidity = form.elements.humidity.value;
        const fecha = new Date().toISOString();
        const datos = leerRegistrosLocales('suculenta-ambiente');
        datos[planta.id] = { temperature: temperature === '' ? null : Number(temperature), humidity: humidity === '' ? null : Number(humidity), date: fechaAString(new Date()) };
        guardarRegistrosLocales('suculenta-ambiente', datos);
        const operacion = { tipo: 'ambiente', plantaId: planta.id, fecha, temperatura: temperature === '' ? null : Number(temperature), humedad: humidity === '' ? null : Number(humidity) };
        if (navigator.onLine) {
            try {
                const registro = { user: usuarioActual.id, planta: planta.id, fecha };
                if (operacion.temperatura !== null) registro.temperatura = operacion.temperatura;
                if (operacion.humedad !== null) registro.humedad = operacion.humedad;
                await pb.collection('mediciones_ambiente').create(registro);
            } catch (error) {
                if (!navigator.onLine || error.status === 0 || error.name === 'TypeError') {
                    try { guardarEnColaOffline(operacion); }
                    catch (queueError) { alert(queueError.message); }
                }
                else alert('La medición quedó en este dispositivo, pero PocketBase no la aceptó. Revisa la colección mediciones_ambiente.');
            }
        } else {
            try { guardarEnColaOffline(operacion); }
            catch (queueError) { alert(queueError.message); }
        }
        renderizarDiario();
    }));
    contenedor.querySelectorAll('.diary-form').forEach(form => form.addEventListener('submit', async e => {
        e.preventDefault();
        const planta = plantas[Number(form.dataset.plantIndex)];
        const texto = form.elements.entry.value.trim();
        if (!texto) return;
        try {
            const file = form.elements.photo.files[0];
            const photo = file ? await comprimirFotoDiario(file) : null;
            const fecha = new Date().toISOString();
            if (navigator.onLine) {
                const fd = new FormData();
                fd.append('user', usuarioActual.id);
                fd.append('planta', planta.id);
                fd.append('fecha', fecha);
                fd.append('texto', texto);
                if (photo) fd.append('foto', archivoDesdeDataURL(photo, file.name || 'diario.jpg'));
                const registro = await pb.collection('diario').create(fd);
                diarioNube.unshift(registro);
            } else {
                const op = { tipo: 'diario-crear', plantaId: planta.id, fecha, texto, foto: photo, nombreArchivo: file?.name || 'diario.jpg' };
                guardarEnColaOffline(op);
                diarioNube.unshift({ id: `local-${Date.now()}`, planta: planta.id, fecha, texto, fotoData: photo, pending: true });
            }
            localStorage.setItem(claveLocal('suculenta-diario-cache'), JSON.stringify(diarioNube));
            renderizarDiario();
        } catch (error) {
            if (!navigator.onLine || error.status === 0 || error.name === 'TypeError') {
                try {
                    const file = form.elements.photo.files[0];
                    const photo = file ? await comprimirFotoDiario(file) : null;
                    const entry = { tipo: 'diario-crear', plantaId: planta.id, fecha: new Date().toISOString(), texto, foto: photo, nombreArchivo: file?.name || 'diario.jpg' };
                    guardarEnColaOffline(entry);
                    diarioNube.unshift({ id: `local-${Date.now()}`, planta: planta.id, fecha: entry.fecha, texto, fotoData: photo, pending: true });
                    localStorage.setItem(claveLocal('suculenta-diario-cache'), JSON.stringify(diarioNube));
                    renderizarDiario();
                    return;
                } catch (offlineError) { alert(offlineError.message || 'No se pudo guardar la entrada sin conexión.'); return; }
            }
            alert('No se pudo guardar la entrada. Comprueba la conexión y el esquema de PocketBase.');
        }
    }));
    contenedor.querySelectorAll('.diary-delete-button').forEach(button => button.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta entrada del diario?')) return;
        const id = button.dataset.recordId;
        const entrada = diarioNube.find(item => item.id === id);
        try {
            if (id.startsWith('legacy-')) {
                const datos = leerRegistrosLocales('suculenta-diario');
                datos[button.dataset.plantId]?.splice(Number(button.dataset.entryIndex), 1);
                guardarRegistrosLocales('suculenta-diario', datos);
            } else if (id.startsWith('local-')) {
                const cola = leerColaOffline().filter(op => !(op.tipo === 'diario-crear' && op.plantaId === button.dataset.plantId && op.fecha === entrada?.fecha));
                localStorage.setItem(claveLocal('suculenta-cola-offline'), JSON.stringify(cola));
            } else if (navigator.onLine) await pb.collection('diario').delete(id);
            else guardarEnColaOffline({ tipo: 'diario-eliminar', id });
            diarioNube = diarioNube.filter(item => item.id !== id);
            localStorage.setItem(claveLocal('suculenta-diario-cache'), JSON.stringify(diarioNube));
            actualizarEstadoSincronizacion();
            renderizarDiario();
        } catch (error) { alert('No se pudo eliminar la entrada.'); }
    }));
    contenedor.querySelectorAll('.diary-photo-button').forEach(button => button.addEventListener('click', () => {
        const entrada = diarioNube.find(item => item.id === button.dataset.recordId);
        const photo = obtenerFotoDiarioURL(entrada);
        if (!photo) return;
        document.getElementById('diary-photo-view').src = photo;
        document.getElementById('diary-photo-modal').classList.remove('hidden');
    }));
}

function obtenerFotoDiarioURL(entrada) {
    if (!entrada) return '';
    if (entrada.fotoData) return entrada.fotoData;
    if (entrada.foto) return pb.files.getURL(entrada, entrada.foto);
    return '';
}

function generarConsejoAmbiente(planta, medicion) {
    if (medicion.temperature === null || medicion.temperature === undefined || medicion.humidity === null || medicion.humidity === undefined) {
        return 'Registra temperatura y humedad para recibir una sugerencia general. Las condiciones ideales dependen de la especie.';
    }
    const consejos = [];
    if (medicion.temperature < 10) consejos.push('La temperatura es baja para muchas suculentas; considera protegerla del frío.');
    else if (medicion.temperature > 32) consejos.push('Hace mucho calor; evita el sol fuerte y revisa que haya buena ventilación.');
    else consejos.push('La temperatura está en un rango moderado para muchas suculentas.');
    if (medicion.humidity > 70) consejos.push('La humedad es alta: mejora la ventilación y evita mojar las hojas.');
    else if (medicion.humidity < 25) consejos.push('El ambiente está seco; evita compensarlo con riegos excesivos.');
    else consejos.push('La humedad ambiental está en un rango moderado.');
    consejos.push(`Preferencia de luz configurada: ${obtenerInfoSol(planta.nivelsol).label.toLowerCase()}.`);
    return `${consejos.join(' ')} Recomendación orientativa, no específica de especie.`;
}

function generarConsejoPersonalizado(planta) {
    const proximo = calcularSiguienteFecha(planta.fechaultimoriego, planta.frecuenciariego);
    const dias = Math.ceil((proximo - new Date()) / 86400000);
    const hemisferioSur = [11, 0, 1, 2].includes(new Date().getMonth());
    const temporada = hemisferioSur ? 'verano' : ([5, 6, 7, 8].includes(new Date().getMonth()) ? 'invierno' : 'transición');
    const consejos = [];
    const especie = `${planta.nombrecientifico || ''} ${planta.nombre || ''}`.toLocaleLowerCase();
    if (/haworthia|haworthiopsis|gasteria/.test(especie)) consejos.push('Este género suele adaptarse a luz brillante indirecta o semisombra; deja secar el sustrato entre riegos.');
    else if (/\baloe\b/.test(especie)) consejos.push('Para Aloe, busca luz brillante y deja secar bien el sustrato antes de regar.');
    else if (/echeveria/.test(especie)) consejos.push('Echeveria suele necesitar mucha luz; aumenta el sol directo gradualmente para evitar quemaduras.');
    else if (planta.nombrecientifico) consejos.push(`Especie registrada: ${planta.nombrecientifico}. La sugerencia usa datos de ubicación y luz; verifica los requisitos de la especie concreta.`);
    if (dias <= 0) consejos.push('El riego figura como pendiente; comprueba que el sustrato esté seco antes de regar.');
    else consejos.push(`Próximo riego estimado en ${dias} día${dias === 1 ? '' : 's'}; verifica el sustrato antes de hacerlo.`);
    if (temporada === 'invierno') consejos.push('En invierno suele bajar la demanda de agua; evita regar por calendario si la tierra sigue húmeda.');
    if (temporada === 'verano') consejos.push('En verano protege del sol intenso de la tarde y revisa el sustrato con más frecuencia.');
    if (/balc[oó]n|exterior|patio|terraza/i.test(planta.ubicacion || '')) consejos.push('Al estar al exterior, considera lluvia, viento y cambios bruscos de temperatura.');
    else if (/interior|ventana|living|habitaci[oó]n/i.test(planta.ubicacion || '')) consejos.push(`Para ${planta.ubicacion}, procura la luz ${obtenerInfoSol(planta.nivelsol).label.toLowerCase()} registrada y buena ventilación.`);
    else consejos.push(`Luz registrada: ${obtenerInfoSol(planta.nivelsol).label.toLowerCase()}. Añade la ubicación para sugerencias más útiles.`);
    return `${consejos.join(' ')} Orientación general por género y datos de la ficha; confirma siempre la humedad del sustrato.`;
}

async function archivoComoDataURL(url) {
    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error('No se pudo incluir una foto en el respaldo.');
    const blob = await respuesta.blob();
    return await new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result);
        lector.onerror = reject;
        lector.readAsDataURL(blob);
    });
}

async function exportarRespaldo() {
    if (!usuarioActual || !navigator.onLine) { alert('Conéctate a PocketBase para crear un respaldo completo.'); return; }
    try {
        await procesarColaOffline();
        if (leerColaOffline().length) throw new Error('Hay cambios pendientes. Espera a que se sincronicen antes de exportar.');
        await cargarRegistrosSincronizados();
        const registrosPlantas = await pb.collection('plantas').getFullList({ sort: 'created', filter: `user="${usuarioActual.id}"` });
        const adjuntarArchivos = async (registro, campos) => {
            const archivos = {};
            for (const campo of campos) {
                const nombres = Array.isArray(registro[campo]) ? registro[campo] : (registro[campo] ? [registro[campo]] : []);
                archivos[campo] = await Promise.all(nombres.map(async nombre => ({ nombre, data: await archivoComoDataURL(pb.files.getURL(registro, nombre)) })));
            }
            return archivos;
        };
        const plantasExportadas = await Promise.all(registrosPlantas.map(async registro => ({ ...registro, __archivos: await adjuntarArchivos(registro, ['imagen', 'fotosgaleria']) })));
        const diarioExportado = await Promise.all(diarioNube.map(async registro => registro.fotoData
            ? ({ ...registro, __archivos: { foto: [{ nombre: 'diario.jpg', data: registro.fotoData }] } })
            : ({ ...registro, __archivos: await adjuntarArchivos(registro, ['foto']) })));
        const respaldo = {
            formato: 'suculenta-inmortal-respaldo', version: 1, generado: new Date().toISOString(),
            plantas: plantasExportadas,
            cuidados: registrosCuidado,
            mediciones: medicionesAmbiente,
            diario: diarioExportado,
            ambiente: leerRegistrosLocales('suculenta-ambiente')
        };
        const blob = new Blob([JSON.stringify(respaldo)], { type: 'application/json' });
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = `suculenta-inmortal-${fechaAString(new Date())}.json`;
        enlace.click();
        URL.revokeObjectURL(enlace.href);
    } catch (error) { console.error(error); alert(error.message || 'No se pudo crear el respaldo.'); }
}

async function importarRespaldo(archivo) {
    if (!archivo || !usuarioActual || !navigator.onLine) { alert('Para importar un respaldo necesitas iniciar sesión y tener conexión a PocketBase.'); return; }
    if (archivo.size > 40 * 1024 * 1024) { alert('El respaldo supera el límite de 40 MB.'); return; }
    if (!confirm('Se agregarán copias de las plantas y registros de este respaldo a tu cuenta. Los datos existentes no se reemplazarán. ¿Continuar?')) return;
    try {
        const respaldo = JSON.parse(await archivo.text());
        if (respaldo.formato !== 'suculenta-inmortal-respaldo' || respaldo.version !== 1) throw new Error('El archivo no es un respaldo compatible de Suculenta Inmortal.');
        const mapa = {};
        const subirArchivos = (fd, archivos = {}) => Object.entries(archivos).forEach(([campo, lista]) => (lista || []).forEach(item => fd.append(campo, archivoDesdeDataURL(item.data, item.nombre))));
        for (const original of respaldo.plantas || []) {
            const fd = new FormData();
            for (const [key, value] of Object.entries(original)) if (!['id', 'collectionId', 'collectionName', 'created', 'updated', 'expand', 'user', '__archivos'].includes(key) && !Object.hasOwn(original.__archivos || {}, key) && value !== null && value !== undefined) fd.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
            fd.append('user', usuarioActual.id);
            subirArchivos(fd, original.__archivos);
            const nuevo = await pb.collection('plantas').create(fd);
            mapa[original.id] = nuevo.id;
        }
        for (const original of respaldo.diario || []) {
            const plantaId = mapa[original.planta] || original.planta;
            if (!mapa[original.planta] && !plantas.some(p => p.id === plantaId)) continue;
            const fd = new FormData();
            fd.append('user', usuarioActual.id); fd.append('planta', plantaId);
            fd.append('fecha', original.fecha || new Date().toISOString()); fd.append('texto', original.texto || '');
            subirArchivos(fd, original.__archivos);
            await pb.collection('diario').create(fd);
        }
        for (const original of respaldo.cuidados || []) {
            const plantaId = mapa[original.planta] || original.planta;
            if (!mapa[original.planta] && !plantas.some(p => p.id === plantaId)) continue;
            await pb.collection('cuidados').create({ user: usuarioActual.id, planta: plantaId, tipo: original.tipo, fecha: original.fecha, nota: original.nota || '' });
        }
        for (const original of respaldo.mediciones || []) {
            const plantaId = mapa[original.planta] || original.planta;
            if (!mapa[original.planta] && !plantas.some(p => p.id === plantaId)) continue;
            const medicion = { user: usuarioActual.id, planta: plantaId, fecha: original.fecha };
            if (original.temperatura !== null && original.temperatura !== undefined) medicion.temperatura = original.temperatura;
            if (original.humedad !== null && original.humedad !== undefined) medicion.humedad = original.humedad;
            await pb.collection('mediciones_ambiente').create(medicion);
        }
        const ambienteLocal = leerRegistrosLocales('suculenta-ambiente');
        Object.entries(respaldo.ambiente || {}).forEach(([oldId, medicion]) => { ambienteLocal[mapa[oldId] || oldId] = medicion; });
        guardarRegistrosLocales('suculenta-ambiente', ambienteLocal);
        await cargarPlantas(); renderizarVistasPrincipales();
        alert('Respaldo importado correctamente.');
    } catch (error) { console.error(error); alert(`No se pudo importar el respaldo: ${error.message || 'error inesperado'}`); }
}

function comprimirFotoDiario(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onerror = () => reject(new Error('No se pudo leer la foto.'));
        lector.onload = () => {
            const imagen = new Image();
            imagen.onerror = () => reject(new Error('Formato de foto no compatible.'));
            imagen.onload = () => {
                const escala = Math.min(1, 1000 / Math.max(imagen.width, imagen.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(imagen.width * escala);
                canvas.height = Math.round(imagen.height * escala);
                canvas.getContext('2d').drawImage(imagen, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.72));
            };
            imagen.src = lector.result;
        };
        lector.readAsDataURL(archivo);
    });
}

async function identificarPlanta() {
    const clave = localStorage.getItem('suculenta-plantnet-key') || '';
    const imagen = document.getElementById('identify-image').files[0];
    const resultado = document.getElementById('identify-results');
    if (!clave) { resultado.textContent = 'Guarda primero tu clave API de Pl@ntNet.'; return; }
    if (!imagen) { resultado.textContent = 'Elige una foto JPG o PNG.'; return; }
    const boton = document.getElementById('identify-button');
    resultado.textContent = 'Analizando foto…';
    boton.disabled = true;
    const datos = new FormData();
    datos.append('images', imagen);
    datos.append('organs', 'auto');
    const controlador = new AbortController();
    const timeout = window.setTimeout(() => controlador.abort(), 60000);
    try {
        const respuesta = await fetch(`https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(clave)}&lang=es&nb-results=3`, { method: 'POST', body: datos, signal: controlador.signal });
        if (!respuesta.ok) throw new Error(respuesta.status === 401 ? 'La clave API no es válida.' : respuesta.status === 429 ? 'Se alcanzó el límite diario de identificaciones.' : `Pl@ntNet respondió con error (${respuesta.status}).`);
        const json = await respuesta.json();
        const candidatos = (json.results || []).slice(0, 3);
        resultado.innerHTML = candidatos.length ? `<h3>Posibles resultados</h3><ol>${candidatos.map(item => `<li><strong>${escaparHTML(item.species?.scientificNameWithoutAuthor || item.species?.scientificName || 'Especie')}</strong> — ${Math.round((item.score || 0) * 100)}%${item.species?.family?.scientificName ? ` · ${escaparHTML(item.species.family.scientificName)}` : ''}</li>`).join('')}</ol><small>Servicio de identificación: Pl@ntNet.</small>` : 'No se encontraron coincidencias. Prueba con una foto clara de hojas o flores.';
    } catch (error) {
        if (error.name === 'AbortError') resultado.textContent = 'Pl@ntNet tardó demasiado en responder. Prueba con otra foto o vuelve a intentarlo con mejor conexión.';
        else if (error.message.includes('Failed to fetch') || error.name === 'TypeError') resultado.textContent = 'No se pudo conectar con Pl@ntNet. Comprueba tu conexión y que la clave API esté activa.';
        else resultado.textContent = error.message;
    } finally {
        window.clearTimeout(timeout);
        boton.disabled = false;
    }
}

function tareasDeHoy() {
    const hoy = fechaAString(new Date());
    return plantas.flatMap(planta => {
        const tareas = [];
        const riego = calcularSiguienteFecha(planta.fechaultimoriego, planta.frecuenciariego);
        if (planta.avisoriego !== false && fechaAString(riego) <= hoy) tareas.push({ planta, tipo: 'riego', fecha: fechaAString(riego) });
        if (usaFertilizanteSeco(planta)) {
            const fecha = calcularSiguienteFecha(planta.fechaultimafertilizacion, planta.frecuenciafertilizante);
            if (planta.avisoabono !== false && fechaAString(fecha) <= hoy) tareas.push({ planta, tipo: 'fertilizado seco', fecha: fechaAString(fecha) });
        }
        if (usaFertilizanteLiquido(planta)) {
            const fecha = calcularSiguienteFecha(planta.fechaultimafertilizacionliquida, planta.frecuenciafertilizanteliquido);
            if (planta.avisoabono !== false && fechaAString(fecha) <= hoy) tareas.push({ planta, tipo: 'fertilizante líquido', fecha: fechaAString(fecha) });
        }
        return tareas;
    });
}

async function revisarRecordatorios() {
    if (esAndroidCapacitor()) return;
    if (localStorage.getItem(claveLocal('suculenta-recordatorios-activos')) !== 'true') return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !plantas.length) return;
    let registro;
    try { registro = JSON.parse(localStorage.getItem(claveLocal('suculenta-recordatorios')) || '{}'); }
    catch (error) { registro = {}; }
    const tareasNuevas = tareasDeHoy().filter(tarea => {
        const id = `${tarea.planta.id}:${tarea.tipo}:${tarea.fecha}`;
        if (registro[id]) return false;
        registro[id] = true;
        return true;
    });
    if (!tareasNuevas.length) return;
    localStorage.setItem(claveLocal('suculenta-recordatorios'), JSON.stringify(registro));
    const resumen = tareasNuevas.slice(0, 5).map(t => `${t.planta.nombre}: ${t.tipo}`).join('\n');
    const texto = tareasNuevas.length > 5 ? `${resumen}\nY ${tareasNuevas.length - 5} más.` : resumen;
    try {
        if ('serviceWorker' in navigator) {
            const sw = await navigator.serviceWorker.ready;
            await sw.showNotification('Cuidados pendientes', { body: texto, icon: 'img/logo.png', tag: `cuidados-${fechaAString(new Date())}` });
        } else new Notification('Cuidados pendientes', { body: texto });
    } catch (error) { console.warn('No se pudo mostrar el recordatorio.', error); }
}

function esAndroidCapacitor() {
    return window.Capacitor?.isNativePlatform?.() === true && window.Capacitor?.getPlatform?.() === 'android';
}

function obtenerPluginNotificaciones() {
    return window.SuculentaLocalNotifications || null;
}

function obtenerHoraRecordatorio() {
    const valor = localStorage.getItem(claveLocal('suculenta-hora-recordatorio')) || '09:00';
    const [hora, minuto] = valor.split(':').map(Number);
    return { hora: Number.isFinite(hora) ? hora : 9, minuto: Number.isFinite(minuto) ? minuto : 0 };
}

function construirNotificacionesCuidado() {
    const ahora = new Date();
    const limite = new Date(ahora);
    limite.setDate(limite.getDate() + 60);
    limite.setHours(23, 59, 59, 999);
    const hoy = fechaAString(ahora);
    const { hora, minuto } = obtenerHoraRecordatorio();
    const tareas = [];

    plantas.forEach(planta => {
        const [horaPlanta, minutoPlanta] = (planta.horaaviso || localStorage.getItem(claveLocal('suculenta-hora-recordatorio')) || '09:00').split(':').map(Number);
        const horaAviso = Number.isFinite(horaPlanta) ? horaPlanta : 9;
        const minutoAviso = Number.isFinite(minutoPlanta) ? minutoPlanta : 0;
        const cuidados = [
            { tipo: 'riego', fecha: planta.fechaultimoriego, frecuencia: planta.frecuenciariego, activo: planta.avisoriego !== false },
            { tipo: 'fertilizado seco', fecha: planta.fechaultimafertilizacion, frecuencia: planta.frecuenciafertilizante, activo: planta.avisoabono !== false },
            { tipo: 'fertilizante líquido', fecha: planta.fechaultimafertilizacionliquida, frecuencia: planta.frecuenciafertilizanteliquida, activo: planta.avisoabono !== false }
        ].filter(cuidado => cuidado.activo && cuidado.fecha && Number.isFinite(Number(cuidado.frecuencia)) && Number(cuidado.frecuencia) > 0);

        cuidados.forEach(cuidado => {
            let vencimiento = calcularSiguienteFecha(cuidado.fecha, Number(cuidado.frecuencia));
            let programoVencido = false;
            let intentos = 0;
            while (vencimiento <= limite && intentos < 100) {
                const fechaVencimiento = fechaAString(vencimiento);
                const programada = new Date(vencimiento);
                programada.setHours(horaAviso, minutoAviso, 0, 0);
                if (programada <= ahora) {
                    if (programoVencido) {
                        vencimiento = calcularSiguienteFecha(vencimiento, Number(cuidado.frecuencia));
                        intentos++;
                        continue;
                    }
                    programada.setTime(ahora.getTime() + 2 * 60 * 1000);
                    programoVencido = true;
                }
                if (programada > ahora && programada <= limite) {
                    tareas.push({
                        planta,
                        tipo: cuidado.tipo,
                        fecha: fechaVencimiento,
                        at: programada
                    });
                }
                vencimiento = calcularSiguienteFecha(vencimiento, Number(cuidado.frecuencia));
                intentos++;
            }
        });
    });

    tareas.sort((a, b) => a.at - b.at || a.planta.nombre.localeCompare(b.planta.nombre));
    const idsUsados = new Set();
    return tareas.slice(0, 450).map(tarea => {
        const clave = `${tarea.planta.id}:${tarea.tipo}:${tarea.fecha}`;
        let hash = 2166136261;
        for (let index = 0; index < clave.length; index++) {
            hash = Math.imul(hash ^ clave.charCodeAt(index), 16777619);
        }
        let id = (hash & 0x7fffffff) || 1;
        while (idsUsados.has(id)) id = id === 0x7fffffff ? 1 : id + 1;
        idsUsados.add(id);
        return {
            id,
            title: 'Cuidado de suculenta',
            body: `${tarea.planta.nombre}: toca ${tarea.tipo}.`,
            schedule: { at: tarea.at },
            channelId: 'care-reminders',
            isExactNotification: false,
            extra: { plantId: tarea.planta.id, type: tarea.tipo, date: tarea.fecha }
        };
    });
}

function ejecutarEnColaRecordatoriosAndroid(tarea) {
    const resultado = colaRecordatoriosAndroid.then(tarea, tarea);
    colaRecordatoriosAndroid = resultado.catch(() => {});
    return resultado;
}

function sincronizarRecordatoriosAndroid() {
    if (!esAndroidCapacitor()) return Promise.resolve();
    return ejecutarEnColaRecordatoriosAndroid(sincronizarRecordatoriosAndroidAhora);
}

async function sincronizarRecordatoriosAndroidAhora() {
    if (!esAndroidCapacitor()) return;
    const plugin = obtenerPluginNotificaciones();
    if (!plugin) return;
    try {
        if (localStorage.getItem(claveLocal('suculenta-recordatorios-activos')) !== 'true') {
            await cancelarPendientesRecordatoriosAndroid();
            return;
        }
        if (!cargaPlantasExitosa) return;
        const pendientes = await plugin.getPending();
        if (pendientes.notifications.length) {
            await plugin.cancel({ notifications: pendientes.notifications.map(item => ({ id: item.id })) });
        }
        if (!plantas.length) return;
        const permiso = await plugin.checkPermissions();
        if (permiso.display !== 'granted') return;
        await plugin.createChannel({
            id: 'care-reminders',
            name: 'Cuidados de plantas',
            description: 'Avisos locales de riego y fertilización',
            importance: 3
        });
        const notificaciones = construirNotificacionesCuidado();
        if (notificaciones.length) await plugin.schedule({ notifications: notificaciones });
        const estado = document.getElementById('reminder-status');
        if (estado) estado.textContent = `Activos aunque cierres la app · ${notificaciones.length} avisos programados${notificaciones.length === 450 ? ' (límite de avisos alcanzado)' : ''} · hora aproximada.`;
    } catch (error) {
        console.warn('No se pudieron programar notificaciones Android.', error);
        const estado = document.getElementById('reminder-status');
        if (estado) estado.textContent = 'No se pudieron programar los avisos. Revisa los permisos de notificación.';
    }
}

async function actualizarEstadoRecordatorios() {
    const estado = document.getElementById('reminder-status');
    const boton = document.getElementById('enable-reminders');
    if (!estado) return;
    const activos = localStorage.getItem(claveLocal('suculenta-recordatorios-activos')) === 'true';
    if (boton) boton.textContent = activos ? 'Desactivar recordatorios' : 'Activar recordatorios';
    if (esAndroidCapacitor()) {
        const plugin = obtenerPluginNotificaciones();
        if (!plugin) { estado.textContent = 'No se pudo inicializar el servicio de notificaciones Android.'; return; }
        try {
            const permiso = await plugin.checkPermissions();
            estado.textContent = permiso.display === 'granted'
                ? (activos ? 'Los avisos se programan también con la app cerrada.' : 'Notificaciones permitidas, aún desactivadas.')
                : 'Permite las notificaciones para recibir avisos Android.';
        } catch (error) { estado.textContent = 'No se pudo consultar el permiso de notificaciones.'; }
        return;
    }
    if (typeof Notification === 'undefined') return;
    estado.textContent = Notification.permission === 'granted' ? 'Recordatorios activos mientras la app esté abierta.' : Notification.permission === 'denied' ? 'Permiso bloqueado en el navegador.' : 'Recordatorios del navegador desactivados.';
}

function cancelarPendientesRecordatoriosAndroid() {
    const plugin = obtenerPluginNotificaciones();
    if (!plugin) return Promise.resolve();
    return plugin.getPending().then(pendientes => {
        if (pendientes.notifications.length) {
            return plugin.cancel({ notifications: pendientes.notifications.map(item => ({ id: item.id })) });
        }
    }).catch(error => {
        console.warn('No se pudieron cancelar los recordatorios Android.', error);
    });
}

function cancelarRecordatoriosAndroid() {
    if (!esAndroidCapacitor()) return Promise.resolve();
    return ejecutarEnColaRecordatoriosAndroid(cancelarPendientesRecordatoriosAndroid);
}

// Inicializacion: conecta eventos, recupera sesion y pinta la primera vista.
async function inicializar() {
    const fertilizingInput = document.getElementById('fertilizing-frequency');
    const liquidFertilizingInput = document.getElementById('liquid-fertilizing-frequency');

    casillaSinFertilizanteSeco.addEventListener('change', () => {
        sincronizarFertilizanteCheckbox(casillaSinFertilizanteSeco, fertilizingInput);
    });
    casillaSinFertilizanteLiquido.addEventListener('change', () => {
        sincronizarFertilizanteCheckbox(casillaSinFertilizanteLiquido, liquidFertilizingInput);
    });

    cargarConfiguracion();
    aplicarTema();

    const claveGuardada = localStorage.getItem('suculenta-plantnet-key');
    if (claveGuardada) document.getElementById('plantnet-api-key').value = claveGuardada;
    document.getElementById('save-plantnet-key').addEventListener('click', () => {
        const clave = document.getElementById('plantnet-api-key').value.trim();
        if (clave) localStorage.setItem('suculenta-plantnet-key', clave);
        else localStorage.removeItem('suculenta-plantnet-key');
        document.getElementById('identify-results').textContent = clave ? 'Clave guardada en este navegador.' : 'Clave eliminada.';
    });
    document.getElementById('identify-button').addEventListener('click', identificarPlanta);
    document.getElementById('enable-reminders').addEventListener('click', async () => {
        const claveActivos = claveLocal('suculenta-recordatorios-activos');
        if (localStorage.getItem(claveActivos) === 'true') {
            localStorage.setItem(claveActivos, 'false');
            await cancelarRecordatoriosAndroid();
            actualizarEstadoRecordatorios();
            return;
        }
        if (esAndroidCapacitor()) {
            const plugin = obtenerPluginNotificaciones();
            if (!plugin) return;
            const permiso = await plugin.requestPermissions();
            if (permiso.display === 'granted') {
                localStorage.setItem(claveActivos, 'true');
                actualizarEstadoRecordatorios();
                await sincronizarRecordatoriosAndroid();
            } else {
                document.getElementById('reminder-status').textContent = 'Permiso de notificaciones denegado en Android.';
            }
            return;
        }
        if (typeof Notification === 'undefined') {
            document.getElementById('reminder-status').textContent = 'Este navegador no admite notificaciones.';
            return;
        }
        const permiso = await Notification.requestPermission();
        if (permiso === 'granted') {
            localStorage.setItem(claveActivos, 'true');
            revisarRecordatorios();
        }
        actualizarEstadoRecordatorios();
    });
    document.getElementById('save-reminder-time').addEventListener('click', async () => {
        const hora = document.getElementById('reminder-time').value || '09:00';
        localStorage.setItem(claveLocal('suculenta-hora-recordatorio'), hora);
        if (localStorage.getItem(claveLocal('suculenta-recordatorios-activos')) === 'true') {
            if (esAndroidCapacitor()) await sincronizarRecordatoriosAndroid();
            else revisarRecordatorios();
        }
        document.getElementById('reminder-status').textContent = 'Hora de recordatorio guardada.';
    });
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
        navigator.serviceWorker.register('./sw.js').catch(error => console.warn('No se pudo registrar el service worker.', error));
    }
    document.getElementById('close-diary-photo-modal').addEventListener('click', () => document.getElementById('diary-photo-modal').classList.add('hidden'));
    document.getElementById('diary-photo-modal').addEventListener('click', e => {
        if (e.target.id === 'diary-photo-modal') e.currentTarget.classList.add('hidden');
    });
    actualizarEstadoRecordatorios();
    window.setInterval(revisarRecordatorios, 15 * 60 * 1000);
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden && usuarioActual) {
            await cargarPlantas();
            await procesarColaOffline();
            renderizarVistasPrincipales();
        }
    });

// Si PocketBase ya tiene una sesión guardada, la restaura automáticamente.
if (pb.authStore.isValid) {

    usuarioActual = pb.authStore.record;

    textoUsuario.textContent = `Bienvenido, ${usuarioActual.usuario}`;

    pantallaInicioSesion.classList.add('hidden');

    await cargarPlantas();
    await procesarColaOffline();

    renderizarVistasPrincipales();

}

    // Eventos principales de formularios, pestanas, imagenes, tema y modal.
    formularioPlanta.addEventListener('submit', manejarEnvioFormulario);
    botonCancelarEdicion.addEventListener('click', limpiarFormulario);
    const contenedorNavegacion = document.querySelector('.nav-container');
    const botonMenuMovil = document.getElementById('mobile-menu-toggle');
    botonMenuMovil.addEventListener('click', () => {
        const abierto = contenedorNavegacion.classList.toggle('mobile-menu-open');
        botonMenuMovil.setAttribute('aria-expanded', String(abierto));
        botonMenuMovil.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    });
    botonesPestana.forEach(btn => btn.addEventListener('click', () => {
        cambiarPestana(btn.dataset.tab);
        contenedorNavegacion.classList.remove('mobile-menu-open');
        botonMenuMovil.setAttribute('aria-expanded', 'false');
        botonMenuMovil.setAttribute('aria-label', 'Abrir menú');
    }));
    inputArchivoImagen.addEventListener('change', async () => {
        if (inputArchivoImagen.files[0]) {
            try {
                const base64 = await archivoABase64(inputArchivoImagen.files[0]);
                imagenVistaPrevia.src = base64;
                imagenVistaPrevia.classList.remove('broken-image');
                vistaPreviaImagen.style.display = 'block';
            } catch (error) {
                console.error(error);
                imagenVistaPrevia.src = IMAGEN_PREDETERMINADA;
                imagenVistaPrevia.classList.add('broken-image');
                vistaPreviaImagen.style.display = 'block';
            }
        } else {
            vistaPreviaImagen.style.display = 'none';
        }
    });
    imagenVistaPrevia.addEventListener('error', () => manejarErrorImagen(imagenVistaPrevia));
    interruptorTema.addEventListener('change', cambiarTema);
    selectorColor.addEventListener('input', (e) => cambiarColorPersonalizado(e.target.value));
    botonCerrarModalDia.addEventListener('click', cerrarModalDia);
    botonCerrarModalNotas.addEventListener('click', cerrarModalNotas);
    modalDia.addEventListener('click', (e) => {
        if (e.target === modalDia) {
            cerrarModalDia();
        }
    });
    modalNotas.addEventListener('click', (e) => {
        if (e.target === modalNotas) {
            cerrarModalNotas();
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModalDia();
            cerrarModalNotas();
        }
    });
    
    limpiarFormulario();
    cambiarPestana('control');
    document.getElementById('plant-search').addEventListener('input', renderizarPlantas);
    document.getElementById('plant-filter').addEventListener('change', renderizarPlantas);
    document.getElementById('export-backup').addEventListener('click', exportarRespaldo);
    document.getElementById('import-backup').addEventListener('change', async event => {
        const archivo = event.target.files?.[0];
        event.target.value = '';
        await importarRespaldo(archivo);
    });
    actualizarEstadoSincronizacion();
}

document.addEventListener('DOMContentLoaded', inicializar);
