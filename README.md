# Suculenta Inmortal

Aplicación web de registro de riego para suculentas usando HTML5, CSS3 y JavaScript vanilla.

## Características

- Registro de plantas con nombre y URL de imagen.
- Gestión de riego y fertilización con frecuencias personalizadas.
- Panel de tarjetas con próximos cuidados.
- Calendario mensual con días marcados para riego y abono.
<<<<<<< HEAD
- Persistencia online con Supabase.
- Respaldo en `localStorage` si Supabase todavía no está configurado.
=======
- Persistencia en Supabase usando la tabla `plantas`.
>>>>>>> f1e2509 (arreglando supabase)
- Interfaz en español con diseño responsive.
- Enlace automático a Wikipedia por nombre de planta.

## Estructura de archivos

- `index.html`: Estructura HTML de la aplicación.
- `style.css`: Estilos CSS con paleta de colores verdes y tierra.
- `script.js`: Lógica JavaScript con comentarios en español.
- `supabase-config.js`: Configuración pública del proyecto Supabase.
- `supabase-schema.sql`: SQL para crear la tabla necesaria en Supabase.
- `data/plantas.json`: Datos anteriores usados como migración inicial si Supabase está vacío.

## Cómo ejecutar

La app puede publicarse en GitHub Pages o Netlify. Para activar guardado online:

1. Crea un proyecto en Supabase.
2. En Supabase, abre SQL Editor y ejecuta el contenido de `supabase-schema.sql`.
3. Copia tu Project URL y anon public key.
4. Pégalos en `supabase-config.js`.

Con eso la web guarda y carga plantas desde Supabase. No hace falta iniciar ningún servidor local.

Si Supabase no está configurado, la aplicación sigue funcionando con `localStorage`.

## Funcionalidades técnicas

<<<<<<< HEAD
- **Persistencia**: Los datos se guardan automáticamente en Supabase. También se conserva una copia en `localStorage` como respaldo.
=======
- **Persistencia**: Los datos se guardan automáticamente en Supabase.
>>>>>>> f1e2509 (arreglando supabase)
- **Cálculos de fechas**: Usa JavaScript nativo para calcular próximos días de riego/fertilización.
- **Calendario dinámico**: Genera el calendario del mes actual con navegación.
- **Responsive**: Diseño adaptable a móviles y escritorio.
- **Validación**: Formulario con validación básica de campos requeridos.

## Notas

La aplicación no usa frameworks externos, solo tecnologías web nativas. Los comentarios en `script.js` explican la lógica de fechas y cálculos.
