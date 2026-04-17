-- CreateTable: tabla de unión muchos-a-muchos usuarios ↔ disciplinas
CREATE TABLE "usuarios_disciplinas" (
    "id"           TEXT NOT NULL,
    "usuario_id"   TEXT NOT NULL,
    "disciplina_id" TEXT NOT NULL,
    CONSTRAINT "usuarios_disciplinas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_disciplinas_usuario_id_disciplina_id_key"
    ON "usuarios_disciplinas"("usuario_id", "disciplina_id");
CREATE INDEX "usuarios_disciplinas_usuario_id_idx"   ON "usuarios_disciplinas"("usuario_id");
CREATE INDEX "usuarios_disciplinas_disciplina_id_idx" ON "usuarios_disciplinas"("disciplina_id");

-- AddForeignKey
ALTER TABLE "usuarios_disciplinas"
    ADD CONSTRAINT "usuarios_disciplinas_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usuarios_disciplinas"
    ADD CONSTRAINT "usuarios_disciplinas_disciplina_id_fkey"
    FOREIGN KEY ("disciplina_id") REFERENCES "disciplinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrar datos existentes de la columna disciplina_id
INSERT INTO "usuarios_disciplinas" ("id", "usuario_id", "disciplina_id")
SELECT gen_random_uuid()::text, u.id, u.disciplina_id
FROM "usuarios" u
WHERE u.disciplina_id IS NOT NULL;

-- Eliminar columna antigua
ALTER TABLE "usuarios" DROP CONSTRAINT IF EXISTS "usuarios_disciplina_id_fkey";
DROP INDEX IF EXISTS "usuarios_disciplina_id_idx";
ALTER TABLE "usuarios" DROP COLUMN IF EXISTS "disciplina_id";
