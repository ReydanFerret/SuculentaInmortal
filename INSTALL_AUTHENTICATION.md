# Instalación del Sistema de Autenticación

## 📋 Resumen de Cambios

Se ha implementado un **sistema de login con usuario y contraseña** que sincroniza las plantas entre dispositivos (PC, móvil, navegadores diferentes, etc.). 

### ✅ Lo que se solucionó:
- Las plantas ahora se guardan por usuario en Supabase
- Se sincronizan automáticamente entre PC y móvil
- Al recargar la página se mantienen los datos
- Al cerrar/abrir el navegador se recupera la sesión
- Cada usuario solo ve sus propias plantas

## 🔧 Pasos para Activar

### 1️⃣ Actualizar Base de Datos Supabase

1. Abre tu [Supabase Dashboard](https://app.supabase.com)
2. Ve al proyecto "SuculentaInmortal"
3. Abre **SQL Editor** → Clica en **+ New Query**
4. Copia y pega el contenido de: **`create_plantas_table.sql`**
5. Haz clic en **Run** (▶️)

**Esto creará:**
- Tabla `usuarios` (para almacenar cuentas)
- Actualiza tabla `plantas` con campo `user_id`

### 2️⃣ Cambiar Script en index.html

Ya está listo, pero verifica que en `index.html` la línea de script sea:
```html
<script src="script-nuevo.js"></script>
```

Si aún dice `script.js`, puedes renombrar `script-nuevo.js` a `script.js` o actualizar la referencia.

### 3️⃣ Prueba de Funcionamiento

1. **Abre el navegador** con tu app
2. Verás una pantalla de **Login**
3. Haz clic en **"Crear cuenta"**
4. Ingresa:
   - **Usuario**: tu nombre de usuario (ej: `juan`)
   - **Contraseña**: una contraseña (ej: `123456`)
   - **Confirmar contraseña**: la misma contraseña
5. Clica en **"Crear cuenta"**
6. Volverá a **Login** automáticamente
7. Ingresa tus credenciales y clica **"Iniciar sesión"**

### 4️⃣ Sincronización Entre Dispositivos

1. **En PC**: Crea una planta después de iniciar sesión
2. **En móvil**: Inicia sesión con la misma cuenta
3. ✅ Verás la planta que creaste en PC
4. **Crea una planta en móvil**: Al refrescar PC, verá la nueva planta

## 📱 Funciones del Login

| Acción | Resultado |
|--------|-----------|
| Crear cuenta | Se registra en Supabase |
| Iniciar sesión | Se guarda sesión en localStorage |
| Cerrar sesión (botón) | Limpia la sesión local y vuelve a login |
| Recargar página | Se restaura automáticamente la sesión |
| Cambiar de navegador/dispositivo | Inicia sesión con la misma cuenta = mishas plantas |

## 🔐 Seguridad

- ✅ Contraseñas hasheadas con SHA-256 en el cliente
- ✅ RLS (Row Level Security) en Supabase (acceso público controlado)
- ✅ Cada usuario solo ve sus datos
- ❓ Para producción: Usar Supabase Auth real con OAuth/JWT

## 🆘 Solución de Problemas

### ❌ "Error al iniciar sesión"
- Verifica que el usuario/contraseña sean correctas
- Confirma que el SQL se ejecutó correctamente en Supabase

### ❌ "Las plantas no se cargan"
- Asegúrate que iniciaste sesión correctamente
- Verifica la consola del navegador (F12 → Console) para errores

### ❌ "Las plantas no se sincronizan entre dispositivos"
- Verifica que uses la MISMA cuenta en ambos dispositivos
- Espera unos segundos (puede haber latencia de red)
- Recarga la página (F5)

### ❌ Script no funciona
- Verifica que `script-nuevo.js` esté en la misma carpeta que `index.html`
- O renombra `script-nuevo.js` a `script.js` y actualiza la referencia en HTML

## 📝 Cambios Técnicos

**Archivos modificados:**
- ✅ `create_plantas_table.sql` - Nuevo schema
- ✅ `index.html` - Pantallas de login/registro
- ✅ `script-nuevo.js` - Lógica de autenticación
- ✅ `style.css` - Estilos para login

**Rutas de datos:**
- `localStorage['suculenta-auth']` - Sesión actual
- `localStorage['suculenta-settings']` - Tema y color
- Supabase DB: `usuarios` y `plantas`

## ✨ Próximos Pasos (Opcional)

Para mejorar la seguridad en producción:

1. **Usar Supabase Auth oficial** (En lugar de login manual)
2. **Backend API** para hashear contraseñas (más seguro que cliente)
3. **Two-Factor Authentication** (2FA)
4. **Verificación de email** al registrarse

¡Listo! Tu app ahora tiene sincronización multi-dispositivo. 🎉
