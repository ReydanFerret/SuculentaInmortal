# Suculenta Inmortal

Gestor de riego y cuidado de suculentas. Añade tus plantas, sube fotos locales y mantén un calendario de tareas de riego y fertilización.

## Características

- 🌿 **Gestión de plantas**: Nombre, imagen (archivos locales) y frecuencias de riego/fertilización
- 📅 **Calendario interactivo**: Visualiza tareas por día
- 📸 **Galería de fotos**: Visualiza tus plantas en una galería
- 🌙 **Tema oscuro/claro**: Personalizable con color variable
- 💾 **Datos en la nube**: Sincronización con PocketBase
- 📔 **Diario de crecimiento**: Entradas con texto y fotos sincronizadas con PocketBase
- 🧾 **Historial de cuidados**: registro de riegos y fertilizaciones realizados
- 📦 **Respaldo**: exportación e importación de plantas, fotos, diario, cuidados y mediciones
- 🔎 **Búsqueda y filtros**: encuentra plantas por nombre, especie, ubicación o tareas pendientes
- 📴 **Modo sin conexión**: conserva una copia local y sincroniza cambios pendientes al reconectar
- 🌡️ **Ambiente y sugerencias**: Registra temperatura y humedad, sincroniza mediciones y muestra consejos por género, ubicación y luz
- 🔎 **Identificación**: Identifica posibles especies mediante Pl@ntNet con una clave API propia
- 🔔 **Recordatorios**: Notificaciones en navegador y avisos Android programados localmente

## Cómo usar

1. Abre `index.html` en tu navegador
2. Añade una planta con nombre e imagen (desde tu dispositivo)
3. Define frecuencias de riego y fertilización
4. Consulta el calendario para saber qué plantas regar cada día

---

**Creado con ❤️ para amantes de las suculentas**
- **Responsive**: Diseño adaptable a móviles y escritorio.
- **Validación**: Formulario con validación básica de campos requeridos.

## Notas

La interfaz web está hecha con tecnologías web nativas; Capacitor se usa como contenedor para Android. Los comentarios en `script.js` explican la lógica de fechas y cálculos.

## Funciones añadidas

- El diario, el historial de cuidados y las mediciones ambientales se sincronizan con PocketBase. Aplica el esquema descrito en [POCKETBASE_MOBILE.md](POCKETBASE_MOBILE.md) antes de usar las nuevas funciones.
- Para identificar plantas, crea una clave en [Pl@ntNet API](https://my.plantnet.org/), habilita el acceso desde el navegador y autoriza el dominio publicado en la configuración de la clave. La app guarda la clave en el navegador y envía la foto a Pl@ntNet; el plan gratuito ofrece hasta 500 identificaciones diarias según sus condiciones actuales.
- En web, los recordatorios requieren HTTPS y permiso del navegador; avisan mientras la app está abierta. En Android se programan avisos locales para que puedan llegar con la app cerrada.
- Los consejos de temperatura y humedad son orientativos para suculentas y no sustituyen recomendaciones específicas de cada especie.

## Aplicación Android

El proyecto se empaqueta con Capacitor. Requiere Node.js 22 o posterior, Android Studio y Android SDK.

1. Ejecuta `npm install`.
2. Ejecuta `npm run android:sync` para copiar la web y generar/sincronizar el proyecto Android.
3. Ejecuta `npm run android:open` y compila el APK desde Android Studio.

La APK incluye la interfaz local y se conecta a PocketBase Mobile en `http://100.69.221.22:8080` (la ruta `/_/` es solo el panel). El teléfono debe poder alcanzar esa IP, por ejemplo, estar conectado al mismo tailnet de Tailscale. Android permite HTTP solo hacia ese host mediante `network_security_config.xml`. Para distribuir fuera de una red privada, configura PocketBase detrás de HTTPS y actualiza `POCKETBASE_URL` en `script.js`. Para habilitar diario sincronizado e historial, aplica [POCKETBASE_MOBILE.md](POCKETBASE_MOBILE.md) antes de usar la nueva versión; hay instrucciones manuales y una migración automatizada en `pb_migrations`. Para identificación, habilita el acceso web en Pl@ntNet y autoriza el origen Android `https://localhost`.

### APK automática y avisos Android

- El workflow `.github/workflows/android-apk.yml` compila una APK de depuración en cada push y pull request, y también se puede iniciar manualmente desde la pestaña **Actions** del repositorio. Descarga `suculenta-inmortal-debug-apk` en los artefactos de la ejecución; se conserva durante 14 días. Es una APK de depuración, no una versión firmada para publicar en Google Play.
- En Android, los avisos se programan localmente hasta 60 días por adelantado, a la hora elegida (09:00 por defecto), y el sistema los puede entregar aunque la app esté cerrada o el teléfono se reinicie. Android puede retrasar avisos por ahorro de batería; la hora es aproximada. El teléfono necesita permiso de notificaciones.
- Al iniciar sesión o volver a la app, se sincronizan los cuidados con PocketBase y se renueva el calendario local de avisos. Los cambios hechos en otro dispositivo no actualizan avisos de un teléfono cerrado hasta que este vuelva a conectarse y sincronice.
- La cola sin conexión se procesa cuando el dispositivo vuelve a tener conexión y abre la app; no se sincroniza con la app completamente cerrada.
