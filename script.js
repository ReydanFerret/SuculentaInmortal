// script.js - Logica de la aplicacion Suculenta Inmortal.
// Responsabilidades principales:
// 1. Autenticacion simple contra Supabase.
// 2. Alta, edicion, borrado y lectura de plantas.
// 3. Calculo del calendario de riego/fertilizacion.
// 4. Renderizado del panel, galeria, tema y color personalizado.

const SUPABASE_URL = 'https://qmcqjfrvvdhefcyttxgt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtY3FqZnJ2dmRoZWZjeXR0eGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTcwNzMsImV4cCI6MjA5MzQzMzA3M30.TlOrraN3IPGTR2hLoZE276lV7g5UZtpkIuii5Xjifds';

// Cliente Supabase compartido por todas las operaciones de base de datos.
let supabase = null;

// Espera a que el CDN cargue window.supabase y crea el cliente.
async function initializeSupabase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 150; // 15 segundos con intervalo de 100ms
        
        const checkSupabase = setInterval(() => {
            attempts++;

            if (window.supabase && window.supabase.createClient) {
                clearInterval(checkSupabase);
                try {
                    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    resolve(true);
                } catch (error) {
                    console.error('✗ Error al crear cliente Supabase:', error);
                    resolve(false);
                }
                return;
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(checkSupabase);
                console.error('✗ Supabase no está disponible después de 15 segundos');
                console.warn('window.supabase:', window.supabase);
                resolve(false);
            }
        }, 100);
    });
}

// Claves de localStorage y textos reutilizados por la UI.
const SETTINGS_KEY = 'suculenta-settings';
const AUTH_KEY = 'suculenta-auth';
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DEFAULT_PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzNTAiIGZpbGw9IiNlMmU4ZjAiLz4KICBDASVBY2xlIGN4PSIyNTAiIGN5PSIxMjAiIHI9IjcwIiBmaWxsPSIjZmZmZmZmIi8+CiAgPHBhdGggZD0iTTM0MCAyMzBjMjAtNjUgODAtMTEwIDExMC0xMjAgMjYtMTAgNDktMjYgNjItNDggMTktMzEgMTQtNjYtMTUtODVTMzYxIDcwIDMzMiA3MGMtMzEtMTktNjYtMTQtODUgMTUtMjQgMzEtMzUgNjctMjUgOTJjMjUgNjAgNzAgMTA1IDExMCAxMjAgMzAgMTAgNjAgMTAgOTQgMCAzMCAxNSA2NSA0NSA4NSIgZmlsbD0iIzQ0OTI3MyIvPgo8L3N2Zz4=';

// Estado vivo de la sesion y de la pantalla actual.
let currentUser = null;
let plantas = [];
let mesActual = new Date().getMonth();
let anioActual = new Date().getFullYear();
let currentEditIndex = null;
let settings = {
    theme: 'light',
    customColor: '#4d8b4d'
};

// Referencias DOM del login y registro.
const noFertilizerCheckbox = document.getElementById('no-fertilizer');
const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const registerScreen = document.getElementById('register-screen');
const registerForm = document.getElementById('register-form');
const toggleRegisterBtn = document.getElementById('toggle-register');
const toggleLoginBtn = document.getElementById('toggle-login');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');

// Referencias DOM de la aplicacion principal.
const form = document.getElementById('plant-form');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
const cancelEditButton = document.getElementById('cancel-edit-button');
const plantsGrid = document.getElementById('plants-grid');
const galeriaGrid = document.getElementById('galeria-grid');
const calendarDiv = document.getElementById('calendar');
const themeSwitch = document.getElementById('theme-switch');
const colorPicker = document.getElementById('color-picker');
const tabBtns = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.section');
const imageFileInput = document.getElementById('plant-image-file');
const imagePreview = document.getElementById('image-preview');
const previewImg = document.getElementById('preview-img');
const dayModal = document.getElementById('day-modal');
const modalTitle = document.getElementById('modal-date-title');
const modalBody = document.getElementById('modal-body');
const closeDayModal = document.getElementById('close-day-modal');

// Hashea la password antes de compararla o guardarla en Supabase.
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
toggleRegisterBtn.addEventListener('click', () => {
    loginScreen.classList.add('hidden');
    registerScreen.classList.remove('hidden');
});

toggleLoginBtn.addEventListener('click', () => {
    registerScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});

// Registro: valida campos, revisa duplicados y crea el usuario.
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Esperar a que Supabase esté disponible
    if (!supabase) {
        await initializeSupabase();
        if (!supabase) {
            mostrarMensaje('register-message', 'Error: No se pudo conectar con el servidor', true);
            return;
        }
    }
    
    const usuario = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;

    if (!usuario) {
        mostrarMensaje('register-message', 'Por favor ingresa un usuario', true);
        return;
    }

    if (password.length < 4) {
        mostrarMensaje('register-message', 'La contraseña debe tener al menos 4 caracteres', true);
        return;
    }

    if (password !== passwordConfirm) {
        mostrarMensaje('register-message', 'Las contraseñas no coinciden', true);
        return;
    }

    try {
        // Verificar si el usuario ya existe
        const { data: existingUser, error: checkError } = await supabase
            .from('usuarios')
            .select('id')
            .eq('usuario', usuario)
            .maybeSingle();

        if (existingUser) {
            mostrarMensaje('register-message', 'Este usuario ya existe', true);
            return;
        }

        const hashedPassword = await hashPassword(password);
        const userId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const { error } = await supabase
            .from('usuarios')
            .insert({
                id: userId,
                usuario: usuario,
                contraseña: hashedPassword
            });

        if (error) throw error;

        mostrarMensaje('register-message', 'Cuenta creada exitosamente. Inicia sesión ahora.');
        setTimeout(() => {
            registerScreen.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            registerForm.reset();
        }, 2000);
    } catch (error) {
        console.error('Error en registro:', error);
        mostrarMensaje('register-message', 'Error al crear la cuenta: ' + error.message, true);
    }
});

// Iniciar sesión
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Esperar a que Supabase esté disponible
    if (!supabase) {
        await initializeSupabase();
        if (!supabase) {
            mostrarMensaje('login-message', 'Error: No se pudo conectar con el servidor', true);
            return;
        }
    }
    
    const usuario = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!usuario || !password) {
        mostrarMensaje('login-message', 'Por favor completa todos los campos', true);
        return;
    }

    try {
        const hashedPassword = await hashPassword(password);

       const { data, error } = await supabase
   .from('usuarios')
    .select('*')
    .eq('usuario', usuario)
    .eq('contraseña', hashedPassword)
    .maybeSingle();

        if (error || !data) {
            mostrarMensaje('login-message', 'Usuario o contraseña incorrectos', true);
            return;
        }

        // Guardar sesión
        currentUser = data;
        localStorage.setItem(AUTH_KEY, JSON.stringify(currentUser));
        
        // Mostrar app, ocultar login
        loginScreen.classList.add('hidden');
        userDisplay.textContent = `Bienvenido, ${currentUser.usuario}`;
        
        // Con usuario restaurado ya se pueden pedir sus plantas. del usuario
        await cargarPlantas();
        renderizarPlantas();
        renderizarCalendario();
        renderizarGaleria();
        
        loginForm.reset();
        mostrarMensaje('login-message', 'Sesión iniciada exitosamente');
    } catch (error) {
        console.error('Error en login:', error);
        mostrarMensaje('login-message', 'Error al iniciar sesión', true);
    }
});

// Cerrar sesión
logoutBtn.addEventListener('click', async () => {
    currentUser = null;
    localStorage.removeItem(AUTH_KEY);
    plantas = [];
    loginForm.reset();
    registerForm.reset();
    loginScreen.classList.remove('hidden');
    userDisplay.textContent = 'Usuario';
    document.getElementById('login-username').focus();
});

// Carga desde Supabase solo las plantas del usuario actual.
async function cargarPlantas() {
    if (!supabase || !currentUser) {
        console.error('No hay usuario autenticado');
        plantas = [];
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('plantas')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('fechacreacion', { ascending: true });

        if (error) throw error;
        plantas = (data || []).map(normalizarPlanta);
    } catch (error) {
        console.error('Error al cargar plantas:', error);
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

// Convierte una fecha guardada en Supabase a texto YYYY-MM-DD para mostrar.
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
    return [planta.imagen || DEFAULT_PLACEHOLDER_IMAGE];
}

// Arma el HTML del mosaico que se reutiliza en tarjetas y galeria.
function crearMosaicoFotos(planta, altTexto, limite = 4) {
    const fotos = obtenerFotosPlanta(planta).slice(0, limite);
    const claseCantidad = `count-${Math.min(fotos.length, limite)}`;
    return `
        <div class="photo-mosaic ${claseCantidad}">
            ${fotos.map((foto, index) => `
                <img src="${foto}" alt="${altTexto}${index > 0 ? ` ${index + 1}` : ''}" onerror="manejarErrorImagen(this)">
            `).join('')}
        </div>
    `;
}

// Parsea una fecha YYYY-MM-DD como fecha local para evitar corrimientos por zona horaria.
function parseFechaYMD(valor) {
    const [anio, mes, dia] = valor.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}

// Normaliza datos viejos/nuevos para que el resto del codigo use una sola forma.
function normalizarPlanta(planta) {
    planta.nombrecientifico = planta.nombrecientifico || '';
    planta.fotosgaleria = normalizarFotosGaleria(planta.fotosgaleria);

    // convertir fertilizante a número real
    planta.frecuenciafertilizante = Number(planta.frecuenciafertilizante);

    // si es inválido -> null REAL
    if (
        isNaN(planta.frecuenciafertilizante) ||
        planta.frecuenciafertilizante <= 0
    ) {
        planta.frecuenciafertilizante = null;
        planta.fechaultimafertilizacion = null;
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

    return planta;
}

function cargarSettings() {
    const guardado = localStorage.getItem(SETTINGS_KEY);
    if (guardado) {
        try {
            settings = { ...settings, ...JSON.parse(guardado) };
        } catch (error) {
            console.error('Error al cargar configuraciones:', error);
        }
    }
}

function guardarSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
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
    document.body.classList.toggle('dark-mode', settings.theme === 'dark');
    themeSwitch.checked = settings.theme === 'dark';
    colorPicker.value = settings.customColor;
    aplicarColorPersonalizado(settings.customColor);
}

// Cambia entre tema claro y oscuro y persiste la eleccion.
function cambiarTema() {
    settings.theme = settings.theme === 'light' ? 'dark' : 'light';
    aplicarTema();
    guardarSettings();
}

// Guarda el nuevo color principal elegido por el usuario.
function cambiarColorPersonalizado(color) {
    settings.customColor = color;
    aplicarColorPersonalizado(color);
    guardarSettings();
}

// Convierte un archivo subido por input[type=file] a data URL base64.
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
    img.src = DEFAULT_PLACEHOLDER_IMAGE;
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
function obtenerMarcacionesDia(fecha) {
    let tieneRiego = false;
    let tieneFertilizacion = false;

    plantas.forEach(planta => {
        if (esDiaProgramado(fecha, planta.fechaultimoriego, planta.frecuenciariego)) {
            tieneRiego = true;
        }
        if (
            planta.frecuenciafertilizante &&
            esDiaProgramado(fecha, planta.fechaultimafertilizacion, planta.frecuenciafertilizante)
        ) {
            tieneFertilizacion = true;
        }
    });

    return { riego: tieneRiego, fertilizacion: tieneFertilizacion };
}

// Lista las tareas que corresponden a una fecha para poblar el modal.
function obtenerPlantasParaFecha(fecha) {
    const tareas = [];
    plantas.forEach((planta, index) => {
        const siguienteRiego = calcularSiguienteFecha(planta.fechaultimoriego, planta.frecuenciariego);
let siguienteFertilizacion = null;

if (planta.frecuenciafertilizante && planta.fechaultimafertilizacion) {
    siguienteFertilizacion = calcularSiguienteFecha(
        planta.fechaultimafertilizacion,
        planta.frecuenciafertilizante
    );
}
        if (fecha.getTime() >= siguienteRiego.getTime()) {
            tareas.push({ index, planta, tipo: 'riego', fecha: siguienteRiego });
        }
        if (siguienteFertilizacion && fecha.getTime() >= siguienteFertilizacion.getTime()) {
            tareas.push({ index, planta, tipo: 'fertilizacion', fecha: siguienteFertilizacion });
        }
    });
    return tareas;
}

// Renderizado: a partir del estado en memoria crea el HTML visible.
function renderizarPlantas() {
    plantsGrid.innerHTML = '';

    if (plantas.length === 0) {
        plantsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">Aún no has añadido plantas. ¡Empieza agregando tu primera suculenta!</p>';
        return;
    }

    plantas.forEach((planta, index) => {

        const proximoRiego = calcularSiguienteFecha(
            planta.fechaultimoriego,
            planta.frecuenciariego
        );
const tieneFertilizante =
    planta.frecuenciafertilizante !== null &&
    planta.frecuenciafertilizante !== undefined &&
    !isNaN(planta.frecuenciafertilizante);

        let proximaFertilizacion = null;

        if (tieneFertilizante) {
            proximaFertilizacion = calcularSiguienteFecha(
                planta.fechaultimafertilizacion,
                planta.frecuenciafertilizante
            );
        }

        const estadoRiego = obtenerEstadoCuidado(
            proximoRiego,
            planta.frecuenciariego
        );

        const estadoFertilizacion = tieneFertilizante
            ? obtenerEstadoCuidado(
                proximaFertilizacion,
                planta.frecuenciafertilizante
            )
            : '';

        const nombreSeguro = escaparHTML(planta.nombre);
        const nombreCientificoSeguro = escaparHTML(planta.nombrecientifico);
        const ultimoRiegoTexto = formatearFechaGuardada(planta.fechaultimoriego);
        const ultimaFertilizacionTexto = formatearFechaGuardada(planta.fechaultimafertilizacion);
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
                <span>${planta.frecuenciariego} días</span>
            </div>

            ${planta.frecuenciafertilizante ? `
            <div class="detail care-detail">
                <span class="care-status-icon fertilizing-icon ${estadoFertilizacion}" aria-hidden="true"></span>
                <strong>Siguiente abonado</strong>
                <span class="next-care-date" title="Ultimo abonado: ${ultimaFertilizacionTexto}">${fechaAString(proximaFertilizacion)}</span>
            </div>

            <div class="detail">
                <strong>Frecuencia abonado</strong>
                <span>${planta.frecuenciafertilizante} días</span>
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

        plantsGrid.appendChild(card);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {

        btn.addEventListener('click', async (e) => {

            const index = parseInt(
                e.target.dataset.index,
                10
            );

            const plantaId = plantas[index].id;

            try {

                await supabase
                    .from('plantas')
                    .delete()
                    .eq('id', plantaId)
                    .eq('user_id', currentUser.id);

            } catch (error) {

                console.error(
                    'Error al eliminar planta:',
                    error
                );
            }

            plantas.splice(index, 1);

            renderizarPlantas();
            renderizarCalendario();
            renderizarGaleria();
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {

        btn.addEventListener('click', (e) => {

            const index = parseInt(
                e.target.dataset.index,
                10
            );

            cargarFormularioEdicion(index);
        });
    });
}

// Dibuja la galeria y conecta el input de fotos de cada planta.
function renderizarGaleria() {
    galeriaGrid.innerHTML = '';

    if (plantas.length === 0) {
        galeriaGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">No hay plantas para mostrar en la galería.</p>';
        return;
    }

    plantas.forEach((planta, index) => {
        const item = document.createElement('div');
        item.className = 'galeria-item';
        const nombreSeguro = escaparHTML(planta.nombre);
        const nombreCientificoSeguro = escaparHTML(planta.nombrecientifico);
        const cantidadFotos = normalizarFotosGaleria(planta.fotosgaleria).length;
        item.innerHTML = `
            ${crearMosaicoFotos(planta, nombreSeguro)}
            <div class="galeria-overlay">
                <h4>${nombreSeguro}</h4>
                ${planta.nombrecientifico ? `<p>${nombreCientificoSeguro}</p>` : ''}
                <span>${cantidadFotos} foto${cantidadFotos === 1 ? '' : 's'} de galeria</span>
                <label class="gallery-add-btn">
                    Agregar fotos
                    <input type="file" class="gallery-file-input" data-index="${index}" accept="image/*" multiple>
                </label>
            </div>
        `;
        galeriaGrid.appendChild(item);
    });

    document.querySelectorAll('.gallery-file-input').forEach(input => {
        input.addEventListener('change', manejarCargaFotosGaleria);
    });
}

// Lee varias fotos, las sube como base64 dentro del jsonb y refresca vistas.
async function manejarCargaFotosGaleria(e) {
    const input = e.target;
    const index = parseInt(input.dataset.index, 10);
    const planta = plantas[index];
    const archivos = Array.from(input.files || []);

    if (!planta || archivos.length === 0) return;

    try {
        const fotosNuevas = await Promise.all(archivos.map(archivoABase64));
        const fotosActuales = normalizarFotosGaleria(planta.fotosgaleria);
        const fotosgaleria = [...fotosActuales, ...fotosNuevas];

        const { error } = await supabase
            .from('plantas')
            .update({ fotosgaleria })
            .eq('id', planta.id)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        planta.fotosgaleria = fotosgaleria;
        input.value = '';
        await cargarPlantas();
        renderizarPlantas();
        renderizarGaleria();
    } catch (error) {
        console.error('Error al agregar fotos a la galeria:', error);
        alert('No se pudieron agregar las fotos: ' + error.message);
        input.value = '';
    }
}

// Dibuja el mes actual, marca dias con tareas y conecta la navegacion.
function renderizarCalendario() {
    const primerDiaMes = new Date(anioActual, mesActual, 1);
    let diaSemanaInicio = primerDiaMes.getDay() - 1;
    if (diaSemanaInicio < 0) diaSemanaInicio = 6;
    const dias = obtenerDiasDelMes(anioActual, mesActual);

    calendarDiv.innerHTML = `
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
                if (marcaciones.riego && marcaciones.fertilizacion) clases.push('both');
                else if (marcaciones.riego) clases.push('watering');
                else if (marcaciones.fertilizacion) clases.push('fertilizing');
                const iconos = [];
                if (marcaciones.riego) iconos.push('<img src="img/regar.png" alt="Riego" class="day-icon">');
                if (marcaciones.fertilizacion) iconos.push('<img src="img/abonar.png" alt="Abono" class="day-icon">');
                const etiqueta = marcaciones.riego && marcaciones.fertilizacion ? 'Riego + Abono' : marcaciones.riego ? 'Riego' : marcaciones.fertilizacion ? 'Abono' : '';
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

    calendarDiv.querySelectorAll('.day[data-date]').forEach(day => {
        day.addEventListener('click', () => {
            mostrarModalDia(parseFechaYMD(day.dataset.date));
        });
    });
}

// Activa una pestana y oculta las demas secciones.
function cambiarPestana(tabId) {
    sections.forEach(section => section.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));
    const targetSection = document.getElementById(`${tabId}-section`);
    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetSection) targetSection.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
}

// Resetea el formulario para volver al modo "agregar planta".
function limpiarFormulario() {
    currentEditIndex = null;
    form.reset();
    imageFileInput.value = '';
    previewImg.src = DEFAULT_PLACEHOLDER_IMAGE;
    previewImg.classList.add('broken-image');
    imagePreview.style.display = 'none';
    formTitle.textContent = 'Añadir nueva planta';
    submitButton.textContent = 'Guardar planta';
    cancelEditButton.classList.add('hidden');
}

// Carga una planta existente en el formulario para editarla.
function cargarFormularioEdicion(index) {
    const planta = plantas[index];
    if (!planta) return;

    currentEditIndex = index;
    formTitle.textContent = 'Editar planta';
    submitButton.textContent = 'Guardar cambios';
    cancelEditButton.classList.remove('hidden');
    document.getElementById('plant-name').value = planta.nombre;
    document.getElementById('plant-scientific-name').value = planta.nombrecientifico || '';
    document.getElementById('watering-frequency').value = planta.frecuenciariego;

    const noFertiliza = planta.frecuenciafertilizante === null;
    const fertilizingInput = document.getElementById('fertilizing-frequency');
    noFertilizerCheckbox.checked = noFertiliza;

    if (noFertiliza) {
        fertilizingInput.disabled = true;
        fertilizingInput.value = '';
    } else {
        fertilizingInput.disabled = false;
        fertilizingInput.value = planta.frecuenciafertilizante;
    }

    previewImg.src = planta.imagen || DEFAULT_PLACEHOLDER_IMAGE;
    if (planta.imagen) {
        previewImg.classList.remove('broken-image');
        imagePreview.style.display = 'block';
    } else {
        previewImg.classList.add('broken-image');
        imagePreview.style.display = 'none';
    }
    imageFileInput.value = '';
    cambiarPestana('control');
}

// Valida el formulario y decide si crear una planta nueva o actualizar una existente.
async function manejarEnvioFormulario(e) {
    e.preventDefault();

    const nombre = document.getElementById('plant-name').value.trim();
    const nombreCientifico = document.getElementById('plant-scientific-name').value.trim();
    const frecuenciaRiego = parseInt(document.getElementById('watering-frequency').value, 10);
    const noFertiliza = noFertilizerCheckbox.checked;
    let frecuenciaFertilizante = null;

    // Si la planta usa fertilizante, la frecuencia es obligatoria y positiva.
    if (!noFertiliza) {
        const valorFertilizante = document.getElementById('fertilizing-frequency').value.trim();
        frecuenciaFertilizante = parseInt(valorFertilizante, 10);

        if (valorFertilizante === '' || isNaN(frecuenciaFertilizante) || frecuenciaFertilizante < 1) {
            alert('La frecuencia de fertilizacion debe ser un numero mayor que 0.');
            return;
        }
    }

    if (!nombre) {
        alert('Por favor, ingresa el nombre de la planta.');
        return;
    }

    if (isNaN(frecuenciaRiego) || frecuenciaRiego < 1) {
        alert('La frecuencia de riego debe ser un numero mayor que 0.');
        return;
    }

    // La imagen principal se convierte a base64; si se edita sin subir otra, se conserva la anterior.
    let imagen = DEFAULT_PLACEHOLDER_IMAGE;
    if (imageFileInput.files[0]) {
        try {
            imagen = await archivoABase64(imageFileInput.files[0]);
        } catch (error) {
            console.error('Error al procesar imagen:', error);
            alert('Error al procesar la imagen.');
            return;
        }
    } else if (currentEditIndex !== null && currentEditIndex >= 0) {
        imagen = plantas[currentEditIndex].imagen || DEFAULT_PLACEHOLDER_IMAGE;
    }

    if (currentEditIndex !== null && currentEditIndex >= 0) {
        const plantaExistente = plantas[currentEditIndex];
        const fechaultimafertilizacion = frecuenciaFertilizante === null
            ? null
            : plantaExistente.fechaultimafertilizacion;

        const { error } = await supabase
            .from('plantas')
            .update({
                nombre,
                nombrecientifico: nombreCientifico,
                frecuenciariego: frecuenciaRiego,
                frecuenciafertilizante: frecuenciaFertilizante,
                fechaultimafertilizacion,
                imagen
            })
            .eq('id', plantaExistente.id)
            .eq('user_id', currentUser.id);

        if (error) {
            console.error('Error al actualizar planta:', error);
            alert('No se pudo actualizar la planta: ' + error.message);
            return;
        }

        await cargarPlantas();
        alert('Planta actualizada exitosamente.');
    } else {
        const fechacreacion = new Date().toISOString();
        const nuevaPlanta = {
            id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            user_id: currentUser.id,
            nombre,
            nombrecientifico: nombreCientifico,
            imagen,
            frecuenciariego: frecuenciaRiego,
            frecuenciafertilizante: frecuenciaFertilizante,
            fotosgaleria: [],
            fechacreacion,
            fechaultimoriego: fechacreacion,
            fechaultimafertilizacion: frecuenciaFertilizante ? fechacreacion : null
        };

        const { error } = await supabase
            .from('plantas')
            .insert(nuevaPlanta);

        if (error) {
            console.error('Error al crear planta:', error);
            alert('No se pudo guardar la planta: ' + error.message);
            return;
        }

        await cargarPlantas();
        alert('Planta anadida exitosamente.');
    }

    limpiarFormulario();
    renderizarPlantas();
    renderizarCalendario();
    renderizarGaleria();
}

// Abre el modal de un dia con tareas programadas y registro manual.
function mostrarModalDia(fecha) {
    const fechaTexto = new Intl.DateTimeFormat('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(fecha);
    modalTitle.textContent = `Actividades para el ${fechaTexto}`;
    modalBody.innerHTML = '';

    const tareas = obtenerPlantasParaFecha(fecha);
    if (plantas.length === 0) {
        modalBody.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Aún no hay plantas cargadas.</p>';
    } else {
        if (tareas.length === 0) {
            modalBody.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin-bottom: 1rem;">No hay tareas programadas para este día. Puedes registrar una actividad manualmente.</p>';
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
            
            const tiposTexto = data.tipos.includes('riego') && data.tipos.includes('fertilizacion') 
                ? 'Riego + Fertilización' 
                : data.tipos.includes('riego') 
                ? 'Riego' 
                : 'Fertilización';
            
            item.innerHTML = `
                <div>
                    <h4>${data.planta.nombre}</h4>
                    <p>Tipo: ${tiposTexto}</p>
                    <p>Programado desde: ${fechaAString(fecha)}</p>
                </div>
            `;
            
            const buttonGroup = document.createElement('div');
            buttonGroup.style.display = 'flex';
            buttonGroup.style.gap = '0.5rem';
            buttonGroup.style.flexWrap = 'wrap';
            
            if (data.tipos.includes('riego')) {
                const riegoBtn = document.createElement('button');
                riegoBtn.className = 'task-btn';
                riegoBtn.type = 'button';
                riegoBtn.textContent = 'Riego ✓';
                riegoBtn.addEventListener('click', () => {
                    marcarAccionRealizada(parseInt(index), 'riego', fecha);
                });
                buttonGroup.appendChild(riegoBtn);
            }
            
            if (data.tipos.includes('fertilizacion')) {
                const fertBtn = document.createElement('button');
                fertBtn.className = 'task-btn';
                fertBtn.type = 'button';
                fertBtn.textContent = 'Fertilización ✓';
                fertBtn.addEventListener('click', () => {
                    marcarAccionRealizada(parseInt(index), 'fertilizacion', fecha);
                });
                buttonGroup.appendChild(fertBtn);
            }
            
            if (data.tipos.includes('riego') && data.tipos.includes('fertilizacion')) {
                const ambosBtn = document.createElement('button');
                ambosBtn.className = 'task-btn';
                ambosBtn.style.backgroundColor = '#10b981';
                ambosBtn.type = 'button';
                ambosBtn.textContent = 'Ambas actividades ✓';
                ambosBtn.addEventListener('click', () => {
                    marcarAccionRealizada(parseInt(index), 'ambas', fecha);
                });
                buttonGroup.appendChild(ambosBtn);
            }
            
            item.appendChild(buttonGroup);
            modalBody.appendChild(item);
        });

        const registroManual = document.createElement('div');
        registroManual.className = 'task-card';
        registroManual.innerHTML = `
            <div>
                <h4>Registrar actividad manual</h4>
                <p>Marca riego o fertilización para cualquier planta en este día.</p>
            </div>
        `;

        const plantaSelect = document.createElement('select');
        plantaSelect.style.padding = '0.6rem';
        plantaSelect.style.border = '1px solid var(--border)';
        plantaSelect.style.borderRadius = '8px';
        plantaSelect.style.background = 'var(--bg-tertiary)';
        plantaSelect.style.color = 'var(--text-color)';
        plantaSelect.innerHTML = plantas.map((planta, index) => `<option value="${index}">${planta.nombre}</option>`).join('');

        const buttonGroup = document.createElement('div');
        buttonGroup.style.display = 'flex';
        buttonGroup.style.gap = '0.5rem';
        buttonGroup.style.flexWrap = 'wrap';
        buttonGroup.style.alignItems = 'center';
        buttonGroup.appendChild(plantaSelect);

        [
            { tipo: 'riego', texto: 'Riego ✓' },
            { tipo: 'fertilizacion', texto: 'Fertilización ✓' },
            { tipo: 'ambas', texto: 'Ambas actividades ✓' }
        ].forEach(({ tipo, texto }) => {
            const boton = document.createElement('button');
            boton.className = 'task-btn';
            boton.type = 'button';
            boton.textContent = texto;
            if (tipo === 'ambas') {
                boton.style.backgroundColor = '#10b981';
            }
            boton.addEventListener('click', () => {
                marcarAccionRealizada(parseInt(plantaSelect.value, 10), tipo, fecha);
            });
            buttonGroup.appendChild(boton);
        });

        registroManual.appendChild(buttonGroup);
        modalBody.appendChild(registroManual);
    }

    dayModal.classList.remove('hidden');
}

// Cierra el modal del calendario.
function cerrarModalDia() {
    dayModal.classList.add('hidden');
}

// Guarda en Supabase que una actividad fue realizada en la fecha elegida.
async function marcarAccionRealizada(index, tipo, fecha) {
    const planta = plantas[index];
    if (!planta) return;

    const fechaISO = fecha.toISOString();
    const cambios = {};

    if (tipo === 'riego' || tipo === 'ambas') {
        planta.fechaultimoriego = fechaISO;
        cambios.fechaultimoriego = fechaISO;
    }
    if (tipo === 'fertilizacion' || tipo === 'ambas') {
        planta.fechaultimafertilizacion = fechaISO;
        cambios.fechaultimafertilizacion = fechaISO;
    }

    const { error } = await supabase
        .from('plantas')
        .update(cambios)
        .eq('id', planta.id)
        .eq('user_id', currentUser.id);

    if (error) {
        console.error('Error al registrar accion:', error);
        alert('No se pudo registrar la accion: ' + error.message);
        return;
    }

    await cargarPlantas();
    renderizarPlantas();
    renderizarCalendario();
    renderizarGaleria();
    mostrarModalDia(fecha);
}

// Inicializacion: conecta eventos, recupera sesion y pinta la primera vista.
async function inicializar() {
    // Este checkbox desactiva la frecuencia de fertilizante cuando no aplica.
    noFertilizerCheckbox.addEventListener('change', () => {
        const fertilizingInput = document.getElementById('fertilizing-frequency');

        if (noFertilizerCheckbox.checked) {
            fertilizingInput.disabled = true;
            fertilizingInput.value = '';
        } else {
            fertilizingInput.disabled = false;
        }
    });
    await initializeSupabase();
    cargarSettings();
    aplicarTema();

    // Si habia una sesion guardada, evita pedir login de nuevo.
    const sesionGuardada = localStorage.getItem(AUTH_KEY);
    if (sesionGuardada) {
        try {
            currentUser = JSON.parse(sesionGuardada);
            userDisplay.textContent = `Bienvenido, ${currentUser.usuario}`;
            loginScreen.classList.add('hidden');
            
            // Con usuario restaurado ya se pueden pedir sus plantas.
            await cargarPlantas();
            renderizarPlantas();
            renderizarCalendario();
            renderizarGaleria();
        } catch (error) {
            console.error('Error al restaurar sesión:', error);
            localStorage.removeItem(AUTH_KEY);
        }
    }

    // Eventos principales de formularios, pestanas, imagenes, tema y modal.
    form.addEventListener('submit', manejarEnvioFormulario);
    cancelEditButton.addEventListener('click', limpiarFormulario);
    tabBtns.forEach(btn => btn.addEventListener('click', () => cambiarPestana(btn.dataset.tab)));
    imageFileInput.addEventListener('change', async () => {
        if (imageFileInput.files[0]) {
            try {
                const base64 = await archivoABase64(imageFileInput.files[0]);
                previewImg.src = base64;
                previewImg.classList.remove('broken-image');
                imagePreview.style.display = 'block';
            } catch (error) {
                console.error(error);
                previewImg.src = DEFAULT_PLACEHOLDER_IMAGE;
                previewImg.classList.add('broken-image');
                imagePreview.style.display = 'block';
            }
        } else {
            imagePreview.style.display = 'none';
        }
    });
    previewImg.addEventListener('error', () => manejarErrorImagen(previewImg));
    themeSwitch.addEventListener('change', cambiarTema);
    colorPicker.addEventListener('input', (e) => cambiarColorPersonalizado(e.target.value));
    closeDayModal.addEventListener('click', cerrarModalDia);
    dayModal.addEventListener('click', (e) => {
        if (e.target === dayModal) {
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
