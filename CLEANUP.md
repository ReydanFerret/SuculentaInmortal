# Archivos a eliminar (opcional)

Estos archivos **NO son necesarios** para ejecutar Suculenta Inmortal y pueden eliminarse de forma segura:

## Archivos obsoletos

```bash
# Archivos de configuración obsoleta (reemplazados por variables en script.js)
rm supabase-config.js
rm supabase-schema.sql

# Datos de respaldo no utilizados
rm -rf data/
```

## Después de eliminarlos

Ejecuta en la terminal:

```bash
git add -A
git commit -m "chore: eliminar archivos obsoletos"
git push
```

---

**Importante**: NO elimines la carpeta `img/` ni sus archivos, son necesarios para que funcione la interfaz.
