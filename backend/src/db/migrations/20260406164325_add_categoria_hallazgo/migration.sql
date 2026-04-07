/*
  Warnings:

  - Added the required column `categoria` to the `hallazgos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CategoriaHallazgo" AS ENUM ('SEGURIDAD', 'MANTENIMIENTO', 'OPERACIONES');

-- AlterTable
ALTER TABLE "hallazgos" ADD COLUMN "categoria" "CategoriaHallazgo" NOT NULL DEFAULT 'OPERACIONES';
ALTER TABLE "hallazgos" ALTER COLUMN "categoria" DROP DEFAULT;
