-- Enum TipoCampo
CREATE TYPE "TipoCampo" AS ENUM ('CHECKBOX_ESTADO', 'NUMERICO', 'TEXTO');

-- Tabla plantillas_verificacion
CREATE TABLE "plantillas_verificacion" (
    "id"            TEXT        NOT NULL,
    "nombre"        TEXT        NOT NULL,
    "descripcion"   TEXT,
    "disciplina_id" TEXT        NOT NULL,
    "activo"        BOOLEAN     NOT NULL DEFAULT true,
    "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plantillas_verificacion_pkey" PRIMARY KEY ("id")
);

-- Tabla campos_plantilla
CREATE TABLE "campos_plantilla" (
    "id"             TEXT        NOT NULL,
    "plantilla_id"   TEXT        NOT NULL,
    "etiqueta"       TEXT        NOT NULL,
    "tipo"           "TipoCampo" NOT NULL,
    "orden"          INTEGER     NOT NULL,
    "es_obligatorio" BOOLEAN     NOT NULL DEFAULT true,
    "unidad_medida"  TEXT,
    CONSTRAINT "campos_plantilla_pkey" PRIMARY KEY ("id")
);

-- Tabla respuestas_campo
CREATE TABLE "respuestas_campo" (
    "id"                TEXT        NOT NULL,
    "item_ejecucion_id" TEXT        NOT NULL,
    "campo_id"          TEXT        NOT NULL,
    "valor"             TEXT        NOT NULL,
    "fecha_registro"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "respuestas_campo_pkey" PRIMARY KEY ("id")
);

-- Columnas nuevas en tablas existentes
ALTER TABLE "pautas_ubts"     ADD COLUMN "plantilla_verif_id" TEXT;
ALTER TABLE "items_ejecucion" ADD COLUMN "plantilla_verif_id" TEXT;

-- Índices
CREATE INDEX "plantillas_verificacion_disciplina_id_idx" ON "plantillas_verificacion"("disciplina_id");
CREATE INDEX "campos_plantilla_plantilla_id_idx"         ON "campos_plantilla"("plantilla_id");
CREATE INDEX "respuestas_campo_item_ejecucion_id_idx"    ON "respuestas_campo"("item_ejecucion_id");
CREATE UNIQUE INDEX "respuestas_campo_item_campo_key"    ON "respuestas_campo"("item_ejecucion_id", "campo_id");

-- Foreign Keys
ALTER TABLE "plantillas_verificacion" ADD CONSTRAINT "plantillas_verificacion_disciplina_id_fkey"
    FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "campos_plantilla" ADD CONSTRAINT "campos_plantilla_plantilla_id_fkey"
    FOREIGN KEY ("plantilla_id") REFERENCES "plantillas_verificacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "respuestas_campo" ADD CONSTRAINT "respuestas_campo_item_ejecucion_id_fkey"
    FOREIGN KEY ("item_ejecucion_id") REFERENCES "items_ejecucion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "respuestas_campo" ADD CONSTRAINT "respuestas_campo_campo_id_fkey"
    FOREIGN KEY ("campo_id") REFERENCES "campos_plantilla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pautas_ubts" ADD CONSTRAINT "pautas_ubts_plantilla_verif_id_fkey"
    FOREIGN KEY ("plantilla_verif_id") REFERENCES "plantillas_verificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "items_ejecucion" ADD CONSTRAINT "items_ejecucion_plantilla_verif_id_fkey"
    FOREIGN KEY ("plantilla_verif_id") REFERENCES "plantillas_verificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
