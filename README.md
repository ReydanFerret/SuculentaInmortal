# Suculenta Inmortal

Aplicación web de registro de riego para suculentas usando HTML5, CSS3 y JavaScript vanilla.

## Características

- Registro de plantas con nombre y URL de imagen.
- Gestión de riego y fertilización con frecuencias personalizadas.
- Panel de tarjetas con próximos cuidados.
- Calendario mensual con días marcados para riego y abono.
- Persistencia en `localStorage` usando JSON.
- Interfaz en español con diseño responsive.
- Enlace automático a Wikipedia por nombre de planta.

## Estructura de archivos

- `index.html`: Estructura HTML de la aplicación.
- `style.css`: Estilos CSS con paleta de colores verdes y tierra.
- `script.js`: Lógica JavaScript con comentarios en español.

## Cómo ejecutar

Simplemente abre `index.html` en tu navegador web. No requiere servidor ni instalación.

## Funcionalidades técnicas

- **Persistencia**: Los datos se guardan automáticamente en localStorage como JSON.
- **Cálculos de fechas**: Usa JavaScript nativo para calcular próximos días de riego/fertilización.
- **Calendario dinámico**: Genera el calendario del mes actual con navegación.
- **Responsive**: Diseño adaptable a móviles y escritorio.
- **Validación**: Formulario con validación básica de campos requeridos.

## Notas

La aplicación no usa frameworks externos, solo tecnologías web nativas. Los comentarios en `script.js` explican la lógica de fechas y cálculos.
