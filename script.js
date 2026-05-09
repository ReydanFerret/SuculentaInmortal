// script.js - Lógica de la aplicación Suculenta Inmortal con Autenticación

const SUPABASE_URL = 'https://qmcqjfrvvdhefcyttxgt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtY3FqZnJ2dmRoZWZjeXR0eGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTcwNzMsImV4cCI6MjA5MzQzMzA3M30.TlOrraN3IPGTR2hLoZE276lV7g5UZtpkIuii5Xjifds';

// Hacer disponible la configuración de Supabase globalmente
window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY
};

let supabase = null;

// Función para esperar a que Supabase esté disponible
async function initializeSupabase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 150; // 15 segundos con intervalo de 100ms
        
        const checkSupabase = setInterval(() => {
            attempts++;
            
            // Log solo cada 10 intentos para no saturar la consola
            if (attempts % 10 === 0 || attempts === 1) {
                console.log(`Verificando Supabase... intento ${attempts}/${maxAttempts}`);
            }
            
            if (window.supabase && window.supabase.createClient) {
                clearInterval(checkSupabase);
                try {
                    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    console.log('✓ Cliente Supabase inicializado correctamente en intento', attempts);
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

// Función para inicializar la aplicación después de que Supabase esté listo
async function initializeApp() {
    await initializeSupabase();
    if (!supabase) {
        alert('Error: No se pudo conectar con Supabase. La aplicación podría no funcionar correctamente.');
    }
}

// Constantes
const SETTINGS_KEY = 'suculenta-settings';
const AUTH_KEY = 'suculenta-auth';
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DEFAULT_PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzNTAiIGZpbGw9IiNlMmU4ZjAiLz4KICBDASVBY2xlIGN4PSIyNTAiIGN5PSIxMjAiIHI9IjcwIiBmaWxsPSIjZmZmZmZmIi8+CiAgPHBhdGggZD0iTTM0MCAyMzBjMjAtNjUgODAtMTEwIDExMC0xMjAgMjYtMTAgNDktMjYgNjItNDggMTktMzEgMTQtNjYtMTUtODVTMzYxIDcwIDMzMiA3MGMtMzEtMTktNjYtMTQtODUgMTUtMjQgMzEtMzUgNjctMjUgOTJjMjUgNjAgNzAgMTA1IDExMCAxMjAgMzAgMTAgNjAgMTAgOTQgMCAzMCAxNSA2NSA0NSA4NSIgZmlsbD0iIzQ0OTI3MyIvPgo8L3N2Zz4=';

// Variables globales
let currentUser = null;
let plantas = [];
let mesActual = new Date().getMonth();
let anioActual = new Date().getFullYear();
let currentEditIndex = null;
let settings = {
    theme: 'light',
    customColor: '#4d8b4d'
};

// Elementos del DOM - Login
const noFertilizerCheckbox = document.getElementById('no-fertilizer');
const loginScreen = document.getElementById('login-screen');
const loginForm = document.getElementById('login-form');
const registerScreen = document.getElementById('register-screen');
const registerForm = document.getElementById('register-form');
const toggleRegisterBtn = document.getElementById('toggle-register');
const toggleLoginBtn = document.getElementById('toggle-login');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');

// Elementos del DOM - App
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

// Hash simple para contraseña
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Mostrar/ocultar mensajes
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

// Alternar entre login y registro
toggleRegisterBtn.addEventListener('click', () => {
    loginScreen.classList.add('hidden');
    registerScreen.classList.remove('hidden');
});

toggleLoginBtn.addEventListener('click', () => {
    registerScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
});

// Registrar usuario
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

console.log("ERROR:", error);
console.log("DATA:", data);
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
        
        // Cargar datos del usuario
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

// Cargar plantas del usuario actual
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
        console.log(`✓ Cargadas ${plantas.length} plantas para ${currentUser.usuario}`);
    } catch (error) {
        console.error('Error al cargar plantas:', error);
        plantas = [];
    }
}

// Funciones de utilidad
function pad(numero) {
    return numero.toString().padStart(2, '0');
}

function fechaAString(fecha) {
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function parseFechaYMD(valor) {
    const [anio, mes, dia] = valor.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
}

function normalizarPlanta(planta) {

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
        !planta.fechaultimorriego
    ) {
        planta.fechaultimorriego =
            planta.fechaUltimoRiego;
    }

    if (
        planta.fechaUltimaFertilizacion &&
        !planta.fechaultimafertilizacion
    ) {
        planta.fechaultimafertilizacion =
            planta.fechaUltimaFertilizacion;
    }

    if (!planta.fechaultimorriego) {
        planta.fechaultimorriego =
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

function obtenerColorContraste(hexColor) {
    const hex = hexColor.replace('#', '');
    const rojo = parseInt(hex.slice(0, 2), 16);
    const verde = parseInt(hex.slice(2, 4), 16);
    const azul = parseInt(hex.slice(4, 6), 16);
    const brillo = (rojo * 299 + verde * 587 + azul * 114) / 1000;
    return brillo > 150 ? '#0f172a' : '#ffffff';
}

function aplicarColorPersonalizado(color) {
    const contraste = obtenerColorContraste(color);
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-light', color);
    document.documentElement.style.setProperty('--accent-contrast', contraste);
    document.body.style.setProperty('--accent', color);
    document.body.style.setProperty('--accent-light', color);
    document.body.style.setProperty('--accent-contrast', contraste);
}

function aplicarTema() {
    document.body.classList.toggle('dark-mode', settings.theme === 'dark');
    themeSwitch.checked = settings.theme === 'dark';
    colorPicker.value = settings.customColor;
    aplicarColorPersonalizado(settings.customColor);
}

function cambiarTema() {
    settings.theme = settings.theme === 'light' ? 'dark' : 'light';
    aplicarTema();
    guardarSettings();
}

function cambiarColorPersonalizado(color) {
    settings.customColor = color;
    aplicarColorPersonalizado(color);
    guardarSettings();
}

function archivoABase64(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result);
        lector.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        lector.readAsDataURL(archivo);
    });
}

function manejarErrorImagen(img) {
    img.onerror = null;
    img.src = DEFAULT_PLACEHOLDER_IMAGE;
    img.classList.add('broken-image');
}

function calcularSiguienteFecha(fechaAnterior, frecuenciaDias) {
    const fecha = new Date(fechaAnterior);
    fecha.setHours(0, 0, 0, 0);
    fecha.setDate(fecha.getDate() + frecuenciaDias);
    return fecha;
}

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

function obtenerDiasDelMes(anio, mes) {
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const dias = [];
    for (let i = 1; i <= diasEnMes; i++) {
        dias.push(new Date(anio, mes, i));
    }
    return dias;
}

function esDiaProgramado(fecha, fechaAnterior, frecuenciaDias) {
    if (!fechaAnterior || frecuenciaDias <= 0) return false;
    const siguiente = calcularSiguienteFecha(fechaAnterior, frecuenciaDias);
    return fechaAString(siguiente) === fechaAString(fecha);
}

function obtenerMarcacionesDia(fecha) {
    let tieneRiego = false;
    let tieneFertilizacion = false;

    plantas.forEach(planta => {
        if (esDiaProgramado(fecha, planta.fechaultimorriego, planta.frecuenciariego)) {
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

function obtenerPlantasParaFecha(fecha) {
    const tareas = [];
    plantas.forEach((planta, index) => {
        const siguienteRiego = calcularSiguienteFecha(planta.fechaultimorriego, planta.frecuenciariego);
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

// Renderizado
function renderizarPlantas() {
    plantsGrid.innerHTML = '';

    if (plantas.length === 0) {
        plantsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">Aún no has añadido plantas. ¡Empieza agregando tu primera suculenta!</p>';
        return;
    }

    plantas.forEach((planta, index) => {

        const proximoRiego = calcularSiguienteFecha(
            planta.fechaultimorriego,
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

        const card = document.createElement('div');

        card.className = 'plant-card';

card.innerHTML = `
    <img src="${planta.imagen || DEFAULT_PLACEHOLDER_IMAGE}" alt="${planta.nombre}" class="plant-image" onerror="manejarErrorImagen(this)">
    <div class="plant-info">
        <h3 class="plant-name">${planta.nombre}</h3>

        <div class="plant-details">

            <div class="detail care-detail">
                <span class="care-status-icon watering-icon ${estadoRiego}" aria-hidden="true"></span>
                <strong>Siguiente riego</strong>
                <span>${fechaAString(proximoRiego)}</span>
            </div>

            <div class="detail">
                <strong>Frecuencia riego</strong>
                <span>${planta.frecuenciariego} días</span>
            </div>

            ${planta.frecuenciafertilizante ? `
            <div class="detail care-detail">
                <span class="care-status-icon fertilizing-icon ${estadoFertilizacion}" aria-hidden="true"></span>
                <strong>Siguiente abonado</strong>
                <span>${fechaAString(proximaFertilizacion)}</span>
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

function renderizarGaleria() {
    galeriaGrid.innerHTML = '';

    if (plantas.length === 0) {
        galeriaGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">No hay plantas para mostrar en la galería.</p>';
        return;
    }

    plantas.forEach(planta => {
        const item = document.createElement('div');
        item.className = 'galeria-item';
        item.innerHTML = `
            <img src="${planta.imagen || DEFAULT_PLACEHOLDER_IMAGE}" alt="${planta.nombre}" onerror="manejarErrorImagen(this)">
            <div class="galeria-overlay">
                <h4>${planta.nombre}</h4>
            </div>
        `;
        galeriaGrid.appendChild(item);
    });
}

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

function cambiarPestana(tabId) {
    sections.forEach(section => section.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));
    const targetSection = document.getElementById(`${tabId}-section`);
    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetSection) targetSection.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
}

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

function cargarFormularioEdicion(index) {
    const planta = plantas[index];
    if (!planta) return;

    currentEditIndex = index;
    formTitle.textContent = 'Editar planta';
    submitButton.textContent = 'Guardar cambios';
    cancelEditButton.classList.remove('hidden');
    document.getElementById('plant-name').value = planta.nombre;
    document.getElementById('watering-frequency').value = planta.frecuenciariego;
const noFertiliza = planta.frecuenciafertilizante === null;
noFertilizerCheckbox.checked = noFertiliza;

const fertilizingInput = document.getElementById('fertilizing-frequency');

if (noFertiliza) {
    fertilizingInput.disabled = true;
    fertilizingInput.value = '';
} else {
    fertilizingInput.disabled = false;
    fertilizingInput.value = planta.frecuenciafertilizante;
}    previewImg.src = planta.imagen || DEFAULT_PLACEHOLDER_IMAGE;
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

async function manejarEnvioFormulario(e) {
    e.preventDefault();

    const nombre = document.getElementById('plant-name').value.trim();
    const frecuenciaRiego = parseInt(document.getElementById('watering-frequency').value, 10);
    const noFertiliza = noFertilizerCheckbox.checked;

let frecuenciaFertilizante = null;

if (!noFertiliza) {

    const valorFertilizante =
        document.getElementById('fertilizing-frequency').value.trim();

    frecuenciaFertilizante = parseInt(valorFertilizante, 10);

    if (
        valorFertilizante === '' ||
        isNaN(frecuenciaFertilizante) ||
        frecuenciaFertilizante < 1
    ) {
        alert('La frecuencia de fertilización debe ser un número mayor que 0.');
        return;
    }

} else {

    frecuenciaFertilizante = null;
}

    if (!nombre) {
        alert('Por favor, ingresa el nombre de la planta.');
        return;
    }

    if (isNaN(frecuenciaRiego) || frecuenciaRiego < 1) {
        alert('La frecuencia de riego debe ser un número mayor que 0.');
        return;
    }

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

    plantaExistente.nombre = nombre;
    plantaExistente.frecuenciariego = frecuenciaRiego;
    plantaExistente.frecuenciafertilizante = frecuenciaFertilizante;
    console.log("ANTES DE GUARDAR");
console.log(frecuenciaFertilizante);
console.log(typeof frecuenciaFertilizante);
    plantaExistente.imagen = imagen;

    // SI NO NECESITA FERTILIZANTE
  if (frecuenciaFertilizante === null) {
    plantaExistente.fechaultimafertilizacion = null;
}

    // GUARDAR EN SUPABASE
    await supabase
        .from('plantas')
        .update({
            nombre: plantaExistente.nombre,
            frecuenciariego: plantaExistente.frecuenciariego,
            frecuenciafertilizante: plantaExistente.frecuenciafertilizante,
fechaultimafertilizacion:
    frecuenciaFertilizante === null
        ? null
        : plantaExistente.fechaultimafertilizacion,            imagen: plantaExistente.imagen
        })
        .eq('id', plantaExistente.id)
        .eq('user_id', currentUser.id);

    await cargarPlantas();

    alert('Planta actualizada exitosamente.');
} else {
        const fechacreacion = new Date().toISOString();
    const nuevaPlanta = {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        user_id: currentUser.id,
        nombre,
        imagen,
        frecuenciariego: frecuenciaRiego,
        frecuenciafertilizante: frecuenciaFertilizante,
        fechacreacion,
        fechaultimorriego: fechacreacion,
        fechaultimafertilizacion: frecuenciaFertilizante ? fechacreacion : null    };

    await supabase
        .from('plantas')
        .insert(nuevaPlanta);

         
            await cargarPlantas();
            alert('¡Planta añadida exitosamente!');
        }

        limpiarFormulario();
        renderizarPlantas();
        renderizarCalendario();
        renderizarGaleria();
    }

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
        plantaSelect.style.border = '1px solid var(--border-color)';
        plantaSelect.style.borderRadius = '8px';
        plantaSelect.style.background = 'var(--card-bg)';
        plantaSelect.style.color = 'var(--text-primary)';
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

function cerrarModalDia() {
    dayModal.classList.add('hidden');
}

async function marcarAccionRealizada(index, tipo, fecha) {
    const planta = plantas[index];
    if (!planta) return;

    if (tipo === 'riego' || tipo === 'ambas') {
        planta.fechaultimorriego = fecha.toISOString();
    }
    if (tipo === 'fertilizacion' || tipo === 'ambas') {
        planta.fechaultimafertilizacion = fecha.toISOString();
    }
    await cargarPlantas();
    renderizarPlantas();
    renderizarCalendario();
    renderizarGaleria();
    mostrarModalDia(fecha);
}

// Inicialización
async function inicializar() {
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

    // Verificar si hay sesión activa
    const sesionGuardada = localStorage.getItem(AUTH_KEY);
    if (sesionGuardada) {
        try {
            currentUser = JSON.parse(sesionGuardada);
            userDisplay.textContent = `Bienvenido, ${currentUser.usuario}`;
            loginScreen.classList.add('hidden');
            
            // Cargar datos
            await cargarPlantas();
            renderizarPlantas();
            renderizarCalendario();
            renderizarGaleria();
        } catch (error) {
            console.error('Error al restaurar sesión:', error);
            localStorage.removeItem(AUTH_KEY);
        }
    }

    // Event listeners
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
