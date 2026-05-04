-- Crea la tabla "plantas" para el proyecto Suculenta Inmortal.
-- Ejecuta este SQL en Supabase -> SQL Editor.

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
