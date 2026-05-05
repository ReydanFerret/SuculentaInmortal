-- Crea las tablas para el proyecto Suculenta Inmortal.
-- Ejecuta este SQL en Supabase -> SQL Editor.
-- NOTA: Si las tablas ya existen, ejecuta primero: DROP TABLE plantas; DROP TABLE usuarios;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  usuario TEXT NOT NULL UNIQUE,
  contraseña TEXT NOT NULL,
  fechacreacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla principal de plantas
CREATE TABLE IF NOT EXISTS plantas (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  imagen TEXT,
  frecuencirriego INTEGER NOT NULL DEFAULT 7,
  frecuenciafertilizante INTEGER NOT NULL DEFAULT 30,
  fechacreacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fechaultimorriego TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fechaultimafertilizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantas ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "usuarios_read" ON usuarios
    FOR SELECT USING (true);

CREATE POLICY "usuarios_insert" ON usuarios
    FOR INSERT WITH CHECK (true);

-- Políticas para plantas (acceso público, se filtra en aplicación)
CREATE POLICY "plantas_read" ON plantas
    FOR SELECT USING (true);

CREATE POLICY "plantas_insert" ON plantas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "plantas_update" ON plantas
    FOR UPDATE USING (true);

CREATE POLICY "plantas_delete" ON plantas
    FOR DELETE USING (true);
