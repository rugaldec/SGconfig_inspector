-- Agregar CASCADE DELETE en ejecuciones_pauta → pautas_inspeccion
ALTER TABLE "ejecuciones_pauta" DROP CONSTRAINT IF EXISTS "ejecuciones_pauta_pauta_id_fkey";
ALTER TABLE "ejecuciones_pauta" ADD CONSTRAINT "ejecuciones_pauta_pauta_id_fkey"
  FOREIGN KEY ("pauta_id") REFERENCES "pautas_inspeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
