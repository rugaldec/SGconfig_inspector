-- CreateTable
CREATE TABLE "listas_correo" (
    "id" TEXT NOT NULL,
    "zona_funcional_id" TEXT NOT NULL,
    "emails" TEXT[],
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listas_correo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listas_correo_zona_funcional_id_key" ON "listas_correo"("zona_funcional_id");

-- AddForeignKey
ALTER TABLE "listas_correo" ADD CONSTRAINT "listas_correo_zona_funcional_id_fkey" FOREIGN KEY ("zona_funcional_id") REFERENCES "ubicaciones_tecnicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
