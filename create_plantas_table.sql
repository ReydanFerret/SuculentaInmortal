-- Crea las tablas para el proyecto Suculenta Inmortal.
-- Ejecuta este SQL en Supabase -> SQL Editor.

-- Tabla de usuarios
create table if not exists usuarios (
  id text primary key,
  usuario text not null unique,
  contraseña text not null,
  fechaCreacion timestamptz not null default now()
);

-- Tabla principal de plantas
create table if not exists plantas (
  id text primary key,
  user_id text not null references usuarios(id) on delete cascade,
  nombre text not null,
  imagen text,
  frecuenciaRiego integer not null default 7,
  frecuenciaFertilizante integer not null default 30,
  fechaCreacion timestamptz not null default now(),
  fechaUltimoRiego timestamptz not null default now(),
  fechaUltimaFertilizacion timestamptz not null default now()
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
