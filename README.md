# Suculenta Inmortal

Gestor de riego y cuidado de suculentas. Añade tus plantas, sube fotos locales y mantén un calendario de tareas de riego y fertilización.

## Características

- 🌿 **Gestión de plantas**: Nombre, imagen (archivos locales) y frecuencias de riego/fertilización
- 📅 **Calendario interactivo**: Visualiza tareas por día
- 📸 **Galería de fotos**: Visualiza tus plantas en una galería
- 🌙 **Tema oscuro/claro**: Personalizable con color variable
- 💾 **Datos en la nube**: Sincronización con Supabase

## Cómo usar

1. Abre `index.html` en tu navegador
2. Añade una planta con nombre e imagen (desde tu dispositivo)
3. Define frecuencias de riego y fertilización
4. Consulta el calendario para saber qué plantas regar cada día

Si los ves en tu repositorio, puedes eliminarlos ejecutando:

```bash
git rm supabase-config.js supabase-schema.sql
git rm -r data/
git commit -m "chore: eliminar archivos obsoletos"
git push
```

⚠️ **NO elimines la carpeta `img/`** - es necesaria para que funcione la interfaz.

## Notas

- Las imágenes se pueden subir como URL o convertidas a Base64.
- Los datos se guardan en tiempo real en Supabase.
- Compatible con navegadores modernos (Chrome, Firefox, Safari, Edge).

---

**Creado con ❤️ para amantes de las suculentas**
- **Responsive**: Diseño adaptable a móviles y escritorio.
- **Validación**: Formulario con validación básica de campos requeridos.

## Notas

La aplicación no usa frameworks externos, solo tecnologías web nativas. Los comentarios en `script.js` explican la lógica de fechas y cálculos.
