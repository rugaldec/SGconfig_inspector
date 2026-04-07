-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'SUPERVISOR', 'INSPECTOR');

-- CreateEnum
CREATE TYPE "Criticidad" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "EstadoHallazgo" AS ENUM ('ABIERTO', 'EN_GESTION', 'PENDIENTE_CIERRE', 'CERRADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicaciones_tecnicas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel" INTEGER NOT NULL,
    "padre_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ubicaciones_tecnicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contadores_aviso" (
    "anio" INTEGER NOT NULL,
    "ultimo_numero" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contadores_aviso_pkey" PRIMARY KEY ("anio")
);

-- CreateTable
CREATE TABLE "hallazgos" (
    "id" TEXT NOT NULL,
    "numero_aviso" TEXT NOT NULL,
    "numero_aviso_sap" TEXT,
    "ubicacion_tecnica_id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "criticidad" "Criticidad" NOT NULL,
    "foto_url" TEXT NOT NULL,
    "estado" "EstadoHallazgo" NOT NULL DEFAULT 'ABIERTO',
    "inspector_id" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hallazgos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios" (
    "id" TEXT NOT NULL,
    "hallazgo_id" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cambios_estado" (
    "id" TEXT NOT NULL,
    "hallazgo_id" TEXT NOT NULL,
    "estado_anterior" "EstadoHallazgo",
    "estado_nuevo" "EstadoHallazgo" NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "motivo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambios_estado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ubicaciones_tecnicas_codigo_key" ON "ubicaciones_tecnicas"("codigo");

-- CreateIndex
CREATE INDEX "ubicaciones_tecnicas_padre_id_idx" ON "ubicaciones_tecnicas"("padre_id");

-- CreateIndex
CREATE INDEX "ubicaciones_tecnicas_nivel_idx" ON "ubicaciones_tecnicas"("nivel");

-- CreateIndex
CREATE UNIQUE INDEX "hallazgos_numero_aviso_key" ON "hallazgos"("numero_aviso");

-- CreateIndex
CREATE INDEX "hallazgos_estado_idx" ON "hallazgos"("estado");

-- CreateIndex
CREATE INDEX "hallazgos_criticidad_idx" ON "hallazgos"("criticidad");

-- CreateIndex
CREATE INDEX "hallazgos_inspector_id_idx" ON "hallazgos"("inspector_id");

-- CreateIndex
CREATE INDEX "hallazgos_ubicacion_tecnica_id_idx" ON "hallazgos"("ubicacion_tecnica_id");

-- CreateIndex
CREATE INDEX "hallazgos_fecha_creacion_idx" ON "hallazgos"("fecha_creacion");

-- CreateIndex
CREATE INDEX "comentarios_hallazgo_id_idx" ON "comentarios"("hallazgo_id");

-- CreateIndex
CREATE INDEX "cambios_estado_hallazgo_id_idx" ON "cambios_estado"("hallazgo_id");

-- AddForeignKey
ALTER TABLE "ubicaciones_tecnicas" ADD CONSTRAINT "ubicaciones_tecnicas_padre_id_fkey" FOREIGN KEY ("padre_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallazgos" ADD CONSTRAINT "hallazgos_ubicacion_tecnica_id_fkey" FOREIGN KEY ("ubicacion_tecnica_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hallazgos" ADD CONSTRAINT "hallazgos_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_hallazgo_id_fkey" FOREIGN KEY ("hallazgo_id") REFERENCES "hallazgos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios" ADD CONSTRAINT "comentarios_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambios_estado" ADD CONSTRAINT "cambios_estado_hallazgo_id_fkey" FOREIGN KEY ("hallazgo_id") REFERENCES "hallazgos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambios_estado" ADD CONSTRAINT "cambios_estado_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
