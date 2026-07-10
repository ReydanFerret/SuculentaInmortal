const POCKETBASE_URL = "https://identity-mod-experiencing-curtis.trycloudflare.com";
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

    console.error(error);
    console.log(error.response);

    alert(JSON.stringify(error.response, null, 2));

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
            fechaultimoriego: planta.fechaultimoriego,
            fechaultimafertilizacion: planta.fechaultimafertilizacion,
            fechaultimafertilizacionliquida: planta.fechaultimafertilizacionliquida,
            fechacreacion: planta.created
        }));

    }
    catch(error){

        console.error(error);

        plantas = [];

    }

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
                    <img src="${foto}" alt="${altTexto}${index > 0 ? ` ${index + 1}` : ''}" onerror="manejarErrorImagen(this)">
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
    img.onerror = null;
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

    plantas.forEach((planta, index) => {
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

                <div class="plant-actions">
                    <div>
                        <button class="edit-btn" data-index="${index}" type="button">Editar</button>
                        <button class="delete-btn" data-index="${index}" type="button">Eliminar</button>
                    </div>
                </div>
            </div>
        `;

        grillaPlantas.appendChild(card);
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
}

async function manejarCargaFotosGaleria(e) {

    const entrada = e.target;
    const index = parseInt(entrada.dataset.index, 10);
    const planta = plantas[index];

    const archivos = Array.from(entrada.files || []);

    if (!planta || archivos.length === 0) return;

    try {

        const formData = new FormData();

        archivos.forEach(archivo => {
            formData.append("fotosgaleria", archivo);
        });

        await pb.collection("plantas").update(
            planta.id,
            formData
        );

        entrada.value = "";

        await cargarPlantas();

        renderizarVistasPrincipales();

        alert("Fotos agregadas correctamente.");

    }  catch (error) {

    console.error(error);
    console.log(error.response);

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

        const fotosgaleria = fotosActuales.filter((_, i) => i !== indiceFoto);

        await actualizarFotosGaleria(planta, fotosgaleria);

    } catch (error) {

        console.error(error);

        alert("No se pudo eliminar la foto.");

    }

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
    inputArchivoImagen.value = '';
    imagenVistaPrevia.src = IMAGEN_PREDETERMINADA;
    imagenVistaPrevia.classList.add('broken-image');
    vistaPreviaImagen.style.display = 'none';
    seleccionarNivelSolFormulario(NIVEL_SOL_PREDETERMINADO);
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

    if (registrarRiego) {
        planta.fechaultimoriego = fechaISO;
        cambios.fechaultimoriego = fechaISO;
    }

    if (registrarSeco && usaFertilizanteSeco(planta)) {
        planta.fechaultimafertilizacion = fechaISO;
        cambios.fechaultimafertilizacion = fechaISO;
    }

    if (registrarLiquido && usaFertilizanteLiquido(planta)) {
        planta.fechaultimafertilizacionliquida = fechaISO;
        cambios.fechaultimafertilizacionliquida = fechaISO;
    }

    if (Object.keys(cambios).length === 0) return;

    try {

        await pb.collection("plantas").update(
            planta.id,
            cambios
        );

        renderizarVistasPrincipales();

        mostrarModalDia(fecha);

    } catch (error) {

        console.error(error);

        alert("No se pudo registrar la acción.");

    }

}

async function manejarEnvioFormulario(e) {

    e.preventDefault();

    const nombre = document.getElementById("plant-name").value.trim();
    const nombreCientifico = document.getElementById("plant-scientific-name").value.trim();
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

    alert(JSON.stringify(error.response, null, 2));
}

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

// Si PocketBase ya tiene una sesión guardada, la restaura automáticamente.
if (pb.authStore.isValid) {

    usuarioActual = pb.authStore.record;

    textoUsuario.textContent = `Bienvenido, ${usuarioActual.usuario}`;

    pantallaInicioSesion.classList.add('hidden');

    await cargarPlantas();

    renderizarVistasPrincipales();

}

    // Eventos principales de formularios, pestanas, imagenes, tema y modal.
    formularioPlanta.addEventListener('submit', manejarEnvioFormulario);
    botonCancelarEdicion.addEventListener('click', limpiarFormulario);
    botonesPestana.forEach(btn => btn.addEventListener('click', () => cambiarPestana(btn.dataset.tab)));
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
    modalDia.addEventListener('click', (e) => {
        if (e.target === modalDia) {
            cerrarModalDia();
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarModalDia();
        }
    });
    
    limpiarFormulario();
    cambiarPestana('control');
}

document.addEventListener('DOMContentLoaded', inicializar);
