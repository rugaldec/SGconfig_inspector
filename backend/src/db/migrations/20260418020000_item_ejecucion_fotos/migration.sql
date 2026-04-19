CREATE TABLE IF NOT EXISTS "items_ejecucion_fotos" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "item_ejecucion_id" TEXT NOT NULL REFERENCES "items_ejecucion"("id") ON DELETE CASCADE,
  "foto_url" TEXT NOT NULL,
  "orden" INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "items_ejecucion_fotos_item_ejecucion_id_idx" ON "items_ejecucion_fotos"("item_ejecucion_id");
