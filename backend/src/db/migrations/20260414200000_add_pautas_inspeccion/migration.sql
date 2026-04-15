-- CreateEnum
CREATE TYPE "EstadoPauta" AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADA');

-- CreateTable: disciplinas
CREATE TABLE "disciplinas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disciplinas_nombre_key" ON "disciplinas"("nombre");

-- AlterTable: agregar disciplina_id a usuarios
ALTER TABLE "usuarios" ADD COLUMN "disciplina_id" TEXT;

-- CreateIndex
CREATE INDEX "usuarios_disciplina_id_idx" ON "usuarios"("disciplina_id");

-- CreateTable: pautas_inspeccion
CREATE TABLE "pautas_inspeccion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "disciplina_id" TEXT NOT NULL,
    "zona_funcional_id" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pautas_inspeccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pautas_inspeccion_disciplina_id_idx" ON "pautas_inspeccion"("disciplina_id");
CREATE INDEX "pautas_inspeccion_zona_funcional_id_idx" ON "pautas_inspeccion"("zona_funcional_id");

-- CreateTable: pautas_ubts
CREATE TABLE "pautas_ubts" (
    "id" TEXT NOT NULL,
    "pauta_id" TEXT NOT NULL,
    "ubicacion_tecnica_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "pautas_ubts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pautas_ubts_pauta_id_ubicacion_tecnica_id_key" ON "pautas_ubts"("pauta_id", "ubicacion_tecnica_id");
CREATE INDEX "pautas_ubts_pauta_id_idx" ON "pautas_ubts"("pauta_id");

-- CreateTable: ejecuciones_pauta
CREATE TABLE "ejecuciones_pauta" (
    "id" TEXT NOT NULL,
    "pauta_id" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoPauta" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_completada" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ejecuciones_pauta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ejecuciones_pauta_pauta_id_idx" ON "ejecuciones_pauta"("pauta_id");
CREATE INDEX "ejecuciones_pauta_estado_idx" ON "ejecuciones_pauta"("estado");

-- CreateTable: items_ejecucion
CREATE TABLE "items_ejecucion" (
    "id" TEXT NOT NULL,
    "ejecucion_id" TEXT NOT NULL,
    "ubicacion_tecnica_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "inspeccionado" BOOLEAN NOT NULL DEFAULT false,
    "ejecutado_por_id" TEXT,
    "fecha_inspeccion" TIMESTAMP(3),
    "observacion" TEXT,
    "hallazgo_id" TEXT,

    CONSTRAINT "items_ejecucion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_ejecucion_hallazgo_id_key" ON "items_ejecucion"("hallazgo_id");
CREATE INDEX "items_ejecucion_ejecucion_id_idx" ON "items_ejecucion"("ejecucion_id");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pautas_inspeccion" ADD CONSTRAINT "pautas_inspeccion_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pautas_inspeccion" ADD CONSTRAINT "pautas_inspeccion_zona_funcional_id_fkey" FOREIGN KEY ("zona_funcional_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pautas_inspeccion" ADD CONSTRAINT "pautas_inspeccion_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pautas_ubts" ADD CONSTRAINT "pautas_ubts_pauta_id_fkey" FOREIGN KEY ("pauta_id") REFERENCES "pautas_inspeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pautas_ubts" ADD CONSTRAINT "pautas_ubts_ubicacion_tecnica_id_fkey" FOREIGN KEY ("ubicacion_tecnica_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejecuciones_pauta" ADD CONSTRAINT "ejecuciones_pauta_pauta_id_fkey" FOREIGN KEY ("pauta_id") REFERENCES "pautas_inspeccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejecuciones_pauta" ADD CONSTRAINT "ejecuciones_pauta_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_ejecucion" ADD CONSTRAINT "items_ejecucion_ejecucion_id_fkey" FOREIGN KEY ("ejecucion_id") REFERENCES "ejecuciones_pauta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_ejecucion" ADD CONSTRAINT "items_ejecucion_ubicacion_tecnica_id_fkey" FOREIGN KEY ("ubicacion_tecnica_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_ejecucion" ADD CONSTRAINT "items_ejecucion_ejecutado_por_id_fkey" FOREIGN KEY ("ejecutado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_ejecucion" ADD CONSTRAINT "items_ejecucion_hallazgo_id_fkey" FOREIGN KEY ("hallazgo_id") REFERENCES "hallazgos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
