-- Sincroniza el enum `estado_sistema` con los valores que ya existen en la base
-- `oita-dev` (agregados fuera del historial de migraciones, sin este archivo el
-- Prisma Client generado no podía leer filas de `sistemas` en estado 'elegibilidad'
-- o 'investigacion' y tiraba: Value 'X' not found in enum 'EstadoSistema').
-- IF NOT EXISTS hace esto seguro de re-ejecutar en cualquier entorno (dev/staging/prod).
ALTER TYPE "estado_sistema" ADD VALUE IF NOT EXISTS 'candidato' AFTER 'retirado';
ALTER TYPE "estado_sistema" ADD VALUE IF NOT EXISTS 'investigacion' AFTER 'candidato';
ALTER TYPE "estado_sistema" ADD VALUE IF NOT EXISTS 'elegibilidad' AFTER 'investigacion';
ALTER TYPE "estado_sistema" ADD VALUE IF NOT EXISTS 'evaluacion_itad' AFTER 'elegibilidad';
ALTER TYPE "estado_sistema" ADD VALUE IF NOT EXISTS 'revision' AFTER 'evaluacion_itad';
ALTER TYPE "estado_sistema" ADD VALUE IF NOT EXISTS 'publicacion' AFTER 'revision';
ALTER TYPE "estado_sistema" ADD VALUE IF NOT EXISTS 'actualizacion' AFTER 'publicacion';
