# ⚡ PRÓXIMOS PASOS - Hazlo Ahora

## 1️⃣ ACTUALIZAR SUPABASE (Crítico)

**Abre:** [https://app.supabase.com](https://app.supabase.com)

1. Selecciona tu proyecto SuculentaInmortal
2. Ve a: **SQL Editor** → **New Query**
3. Copia TODO el contenido de: **`create_plantas_table.sql`**
4. Pega en el editor
5. Haz click en **Run** (el botón ▶️ azul)
6. Espera a que termine (saldrá mensaje "Success")

**Esto actualiza:**
- ✅ Crea tabla `usuarios`
- ✅ Actualiza tabla `plantas` con `user_id`

Sin este paso, el login NO funcionará.

---

## 2️⃣ RENOMBRAR SCRIPT (Opcional)

El archivo `script-nuevo.js` necesita ser `script.js`

**Opción A - Renombrar (Si tienes acceso a terminal):**
```bash
cd /workspaces/SuculentaInmortal
mv script-nuevo.js script.js
```

**Opción B - O actualiza manualmente en index.html:**
- En `index.html` busca `<script src="` cerca del final
- Cambia `script-nuevo.js` a `script.js`

---

## 3️⃣ PROBAR EN NAVEGADOR

1. Abre tu app en el navegador
2. Deberías ver una pantalla de LOGIN
3. Si no ves login:
   - Abre Consola (F12)
   - Busca errores rojos
   - Verifica que Supabase esté inicializado

---

## 4️⃣ CREAR CUENTA DE PRUEBA

1. Click en **"Crear cuenta"**
2. Ingresa:
   - Usuario: `test` (o lo que quieras)
   - Contraseña: `1234`
   - Confirmar: `1234`
3. Click **"Crear cuenta"**
4. Volverá a login automáticamente
5. Ingresa tus credenciales nuevas
6. Click **"Iniciar sesión"**

---

## 5️⃣ PRUEBA CROSS-DEVICE

**En el MISMO navegador, abre 2 pestañas:**
- Pestaña 1: Crea una planta
- Pestaña 2: Recarga (F5)
- ✅ Deberías ver la planta que creaste

**En diferente navegador (si tienes):**
- Abre el navegador 2 (Chrome, Firefox, Safari, etc)
- Inicia sesión con MISMA cuenta
- ✅ Deberías ver las mismas plantas

**En móvil (si tienes):**
- Abre tu app en móvil
- Inicia sesión con MISMA cuenta
- ✅ Deberías ver las mismas plantas del PC

---

## ✅ VERIFICACIÓN RÁPIDA

| Qué | Debe Pasar |
|-----|-----------|
| Recargar página | Se mantiene la sesión (no pide login) |
| Crear planta | Aparece inmediatamente |
| Cambiar navegador | Misma cuenta = mismas plantas |
| Cerrar sesión | Vuelve a login, datos se borran localmente |
| Reabrir app | Si cierras el navegador completamente y reabre, restaura sesión |

---

## ⚠️ PROBLEMAS COMUNES

**"Tabla no existe"**
- No ejecutaste el SQL correctamente
- Asegúrate de que salga "Success" al ejecutar

**"Usuario o contraseña incorrectos"**
- Escribe exactamente igual al registrarte
- Las mayúsculas/minúsculas importan

**"No me carga las plantas cuando inicia sesión"**
- Abre consola (F12) 
- Mira si hay errores en rojo
- Probablemente es error de Supabase

**"El script no carga"**
- `script-nuevo.js` debe estar en la misma carpeta que `index.html`
- O renómbralo a `script.js`

---

## 📚 DOCUMENTACIÓN

- `INSTALL_AUTHENTICATION.md` - Guía completa 
- `IMPLEMENTATION_SUMMARY.md` - Resumen técnico
- `create_plantas_table.sql` - Schema de BD

---

**¡Listo! Dime cualquier problema y lo resolvemos.** 🚀
