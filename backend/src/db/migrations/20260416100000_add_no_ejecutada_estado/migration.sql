-- AlterEnum
ALTER TYPE "EstadoPauta" ADD VALUE 'NO_EJECUTADA';

-- Agregar columna motivo_cierre a ejecuciones_pauta para registrar el motivo del cierre
ALTER TABLE "ejecuciones_pauta" ADD COLUMN IF NOT EXISTS "motivo_cierre" TEXT;
