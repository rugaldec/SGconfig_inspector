-- Migración: frecuencia y relanzamiento automático de ejecuciones
-- Aplica en: backend/ con: npx prisma migrate deploy --schema=src/db/schema.prisma

ALTER TABLE "ejecuciones_pauta"
  ADD COLUMN IF NOT EXISTS "relanzamiento_auto"  BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "frecuencia_tipo"      TEXT,
  ADD COLUMN IF NOT EXISTS "frecuencia_dias"      INTEGER,
  ADD COLUMN IF NOT EXISTS "duracion_dias"        INTEGER,
  ADD COLUMN IF NOT EXISTS "max_ejecuciones"      INTEGER,
  ADD COLUMN IF NOT EXISTS "numero_ronda"         INTEGER  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "origen"               TEXT     NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS "ejecucion_padre_id"   TEXT;

-- Clave foránea auto-referencial (ciclo de rondas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ejecuciones_pauta_ejecucion_padre_id_fkey'
  ) THEN
    ALTER TABLE "ejecuciones_pauta"
      ADD CONSTRAINT "ejecuciones_pauta_ejecucion_padre_id_fkey"
      FOREIGN KEY ("ejecucion_padre_id")
      REFERENCES "ejecuciones_pauta"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ejecuciones_pauta_ejecucion_padre_id_idx"
  ON "ejecuciones_pauta"("ejecucion_padre_id");
