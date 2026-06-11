-- AlterTable
ALTER TABLE "hallazgos" ADD COLUMN "deleted_at" TIMESTAMP(3),
ADD COLUMN "deleted_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "hallazgos" ADD CONSTRAINT "hallazgos_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "hallazgos_deleted_at_idx" ON "hallazgos"("deleted_at");
