-- Crea la tabla "plantas" para el proyecto Suculenta Inmortal.
-- Ejecuta este SQL en Supabase -> SQL Editor.

-- Tabla principal
create table if not exists plantas (
  id text primary key,
  nombre text not null,
  imagen text,
  frecuenciaRiego integer not null default 7,
  frecuenciaFertilizante integer not null default 30,
  fechaCreacion timestamptz not null default now(),
  fechaUltimoRiego timestamptz not null default now(),
  fechaUltimaFertilizacion timestamptz not null default now()
);

-- Habilitar RLS para acceso público (permite lectura/escritura sin autenticación)
ALTER TABLE plantas ENABLE ROW LEVEL SECURITY;

-- Política de lectura
CREATE POLICY "plantas_read" ON plantas
    FOR SELECT USING (true);

-- Política de inserción
CREATE POLICY "plantas_insert" ON plantas
    FOR INSERT WITH CHECK (true);

-- Política de actualización
CREATE POLICY "plantas_update" ON plantas
    FOR UPDATE USING (true);

-- Política de eliminación
CREATE POLICY "plantas_delete" ON plantas
    FOR DELETE USING (true);
