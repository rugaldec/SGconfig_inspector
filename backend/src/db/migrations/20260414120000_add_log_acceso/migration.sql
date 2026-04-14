-- CreateTable
CREATE TABLE "logs_acceso" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "exitoso" BOOLEAN NOT NULL,
    "motivo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_acceso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "logs_acceso_fecha_idx" ON "logs_acceso"("fecha");

-- CreateIndex
CREATE INDEX "logs_acceso_usuario_id_idx" ON "logs_acceso"("usuario_id");

-- AddForeignKey
ALTER TABLE "logs_acceso" ADD CONSTRAINT "logs_acceso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
