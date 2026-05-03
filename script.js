// script.js - Lógica de la aplicación Suculenta Inmortal

const STORAGE_KEY = 'suculenta-plantas';
const SETTINGS_KEY = 'suculenta-settings';
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DEFAULT_PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjM1MCIgdmlld0JveD0iMCAwIDUwMCAzNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIzNTAiIGZpbGw9IiNlMmU4ZjAiLz4KICA8Y2lyY2xlIGN4PSIyNTAiIGN5PSIxMjAiIHI9IjcwIiBmaWxsPSIjZmZmZmZmIi8+CiAgPHBhdGggZD0iTTM0MCAyMzBjMjAtNjUgODAtMTEwIDExMC0xMjAgMjYtMTAgNDktMjYgNjItNDggMTktMzEgMTQtNjYtMTUtODVTMzYxIDcwIDMzMiA3MGMtMzEtMTktNjYtMTQtODUgMTUtMjQgMzEtMzUgNjctMjUgOTJjMjUgNjAgNzAgMTA1IDExMCAxMjAgMzAgMTAgNjAgMTAgOTQgMCAzMCAxNSA2NSA0NSA4NSIgZmlsbD0iIzQ0OTI3MyIvPgo8L3N2Zz4=';

const form = document.getElementById('plant-form');
const formTitle = document.getElementById('form-title');
const submitButton = document.getElementById('submit-button');
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

let plantas = [];
let mesActual = new Date().getMonth();
let añoActual = new Date().getFullYear();
let currentEditIndex = null;
let settings = {
    theme: 'light',
    customColor: '#4d8b4d'
};

function pad(numero) {
    return numero.toString().padStart(2, '0');
}

function fechaAString(fecha) {
    return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function parseFechaYMD(valor) {
    const [año, mes, dia] = valor.split('-').map(Number);
    return new Date(año, mes - 1, dia);
}

function normalizarPlanta(planta) {
    if (!planta.fechaUltimoRiego) {
        planta.fechaUltimoRiego = planta.fechaCreacion || new Date().toISOString();
    }
    if (!planta.fechaUltimaFertilizacion) {
        planta.fechaUltimaFertilizacion = planta.fechaCreacion || new Date().toISOString();
    }
    return planta;
}

function cargarPlantas() {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) {
        try {
            plantas = JSON.parse(guardado).map(normalizarPlanta);
        } catch (error) {
            console.error('Error al cargar plantas:', error);
            plantas = [];
        }
    }
}

function guardarPlantas() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plantas));
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

function aplicarTema() {
    document.body.classList.toggle('dark-mode', settings.theme === 'dark');
    themeSwitch.checked = settings.theme === 'dark';
    colorPicker.value = settings.customColor;
    document.documentElement.style.setProperty('--accent', settings.customColor);
    document.documentElement.style.setProperty('--accent-light', settings.customColor);
}

function cambiarTema() {
    settings.theme = settings.theme === 'light' ? 'dark' : 'light';
    aplicarTema();
    guardarSettings();
}

function cambiarColorPersonalizado(color) {
    settings.customColor = color;
    document.documentElement.style.setProperty('--accent', color);
    document.documentElement.style.setProperty('--accent-light', color);
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

function obtenerDiasDelMes(año, mes) {
    const diasEnMes = new Date(año, mes + 1, 0).getDate();
    const dias = [];
    for (let i = 1; i <= diasEnMes; i++) {
        dias.push(new Date(año, mes, i));
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
        if (esDiaProgramado(fecha, planta.fechaUltimoRiego, planta.frecuenciaRiego)) {
            tieneRiego = true;
        }
        if (esDiaProgramado(fecha, planta.fechaUltimaFertilizacion, planta.frecuenciaFertilizante)) {
            tieneFertilizacion = true;
        }
    });

    return { riego: tieneRiego, fertilizacion: tieneFertilizacion };
}

function obtenerPlantasParaFecha(fecha) {
    const tareas = [];
    plantas.forEach((planta, index) => {
        const siguienteRiego = calcularSiguienteFecha(planta.fechaUltimoRiego, planta.frecuenciaRiego);
        const siguienteFertilizacion = calcularSiguienteFecha(planta.fechaUltimaFertilizacion, planta.frecuenciaFertilizante);

        if (fecha.getTime() >= siguienteRiego.getTime()) {
            tareas.push({ index, planta, tipo: 'riego', fecha: siguienteRiego });
        }
        if (fecha.getTime() >= siguienteFertilizacion.getTime()) {
            tareas.push({ index, planta, tipo: 'fertilizacion', fecha: siguienteFertilizacion });
        }
    });
    return tareas;
}

function renderizarPlantas() {
    plantsGrid.innerHTML = '';

    if (plantas.length === 0) {
        plantsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">Aún no has añadido plantas. ¡Empieza agregando tu primera suculenta!</p>';
        return;
    }

    plantas.forEach((planta, index) => {
        const proximoRiego = calcularSiguienteFecha(planta.fechaUltimoRiego, planta.frecuenciaRiego);

        const card = document.createElement('div');
        card.className = 'plant-card';
        card.innerHTML = `
            <img src="${planta.imagen || DEFAULT_PLACEHOLDER_IMAGE}" alt="${planta.nombre}" class="plant-image" onerror="manejarErrorImagen(this)">
            <div class="plant-info">
                <h3 class="plant-name">${planta.nombre}</h3>
                <div class="plant-details">
                    <div class="detail">
                        <strong>Siguiente riego</strong>
                        <span>${fechaAString(proximoRiego)}</span>
                    </div>
                    <div class="detail">
                        <strong>Frecuencia</strong>
                        <span>${planta.frecuenciaRiego} días</span>
                    </div>
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
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            plantas.splice(index, 1);
            guardarPlantas();
            renderizarPlantas();
            renderizarCalendario();
            renderizarGaleria();
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
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
    const primerDiaMes = new Date(añoActual, mesActual, 1);
    let diaSemanaInicio = primerDiaMes.getDay() - 1;
    if (diaSemanaInicio < 0) diaSemanaInicio = 6;
    const dias = obtenerDiasDelMes(añoActual, mesActual);

    calendarDiv.innerHTML = `
        <div class="calendar-header">
            <h3>${MESES[mesActual]} ${añoActual}</h3>
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
                if (marcaciones.riego) iconos.push('💧');
                if (marcaciones.fertilizacion) iconos.push('🌱');
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
            añoActual--;
        }
        renderizarCalendario();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        mesActual++;
        if (mesActual > 11) {
            mesActual = 0;
            añoActual++;
        }
        renderizarCalendario();
    });

    document.getElementById('today').addEventListener('click', () => {
        const hoy = new Date();
        mesActual = hoy.getMonth();
        añoActual = hoy.getFullYear();
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
}

function cargarFormularioEdicion(index) {
    const planta = plantas[index];
    if (!planta) return;

    currentEditIndex = index;
    formTitle.textContent = 'Editar planta';
    submitButton.textContent = 'Guardar cambios';
    document.getElementById('plant-name').value = planta.nombre;
    document.getElementById('watering-frequency').value = planta.frecuenciaRiego;
    document.getElementById('fertilizing-frequency').value = planta.frecuenciaFertilizante;
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

async function manejarEnvioFormulario(e) {
    e.preventDefault();

    const nombre = document.getElementById('plant-name').value.trim();
    const frecuenciaRiego = parseInt(document.getElementById('watering-frequency').value, 10);
    const frecuenciaFertilizante = parseInt(document.getElementById('fertilizing-frequency').value, 10);

    if (!nombre) {
        alert('Por favor, ingresa el nombre de la planta.');
        return;
    }

    if (isNaN(frecuenciaRiego) || frecuenciaRiego < 1) {
        alert('La frecuencia de riego debe ser un número mayor que 0.');
        return;
    }

    if (isNaN(frecuenciaFertilizante) || frecuenciaFertilizante < 1) {
        alert('La frecuencia de fertilización debe ser un número mayor que 0.');
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
        plantaExistente.frecuenciaRiego = frecuenciaRiego;
        plantaExistente.frecuenciaFertilizante = frecuenciaFertilizante;
        plantaExistente.imagen = imagen;
        guardarPlantas();
        alert('Planta actualizada exitosamente.');
    } else {
        const fechaCreacion = new Date().toISOString();
        plantas.push({
            nombre,
            imagen,
            frecuenciaRiego,
            frecuenciaFertilizante,
            fechaCreacion,
            fechaUltimoRiego: fechaCreacion,
            fechaUltimaFertilizacion: fechaCreacion
        });
        guardarPlantas();
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
    if (tareas.length === 0) {
        modalBody.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No hay tareas programadas para este día.</p>';
    } else {
        // Agrupar tareas por planta
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
    }

    dayModal.classList.remove('hidden');
}

function cerrarModalDia() {
    dayModal.classList.add('hidden');
}

function marcarAccionRealizada(index, tipo, fecha) {
    const planta = plantas[index];
    if (!planta) return;

    if (tipo === 'riego') {
        planta.fechaUltimoRiego = fecha.toISOString();
    } else {
        planta.fechaUltimaFertilizacion = fecha.toISOString();
    }

    guardarPlantas();
    renderizarPlantas();
    renderizarCalendario();
    renderizarGaleria();
    renderizarBiblioteca();
    mostrarModalDia(fecha);
}

function inicializar() {
    cargarPlantas();
    cargarSettings();
    aplicarTema();
    renderizarPlantas();
    renderizarCalendario();
    renderizarGaleria();
    renderizarBiblioteca();

    form.addEventListener('submit', manejarEnvioFormulario);
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
