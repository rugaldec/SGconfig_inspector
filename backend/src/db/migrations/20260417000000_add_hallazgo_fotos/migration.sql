-- Tabla de fotos adicionales de hallazgos (INICIAL o CIERRE)
CREATE TABLE "hallazgo_fotos" (
  "id"          TEXT         NOT NULL,
  "hallazgo_id" TEXT         NOT NULL,
  "foto_url"    TEXT         NOT NULL,
  "tipo"        TEXT         NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hallazgo_fotos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hallazgo_fotos_hallazgo_id_fkey"
    FOREIGN KEY ("hallazgo_id") REFERENCES "hallazgos"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "hallazgo_fotos_hallazgo_id_idx" ON "hallazgo_fotos"("hallazgo_id");
