-- CreateTable
CREATE TABLE "logs_correo" (
    "id" TEXT NOT NULL,
    "hallazgo_id" TEXT,
    "zona_funcional_id" TEXT,
    "destinatarios" TEXT[],
    "asunto" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "error_mensaje" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_correo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "logs_correo_fecha_creacion_idx" ON "logs_correo"("fecha_creacion");

-- CreateIndex
CREATE INDEX "logs_correo_hallazgo_id_idx" ON "logs_correo"("hallazgo_id");

-- AddForeignKey
ALTER TABLE "logs_correo" ADD CONSTRAINT "logs_correo_hallazgo_id_fkey" FOREIGN KEY ("hallazgo_id") REFERENCES "hallazgos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs_correo" ADD CONSTRAINT "logs_correo_zona_funcional_id_fkey" FOREIGN KEY ("zona_funcional_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
