-- Hace zona_funcional_id opcional en pautas_inspeccion
-- Una pauta puede cubrir componentes de múltiples áreas

ALTER TABLE "pautas_inspeccion" ALTER COLUMN "zona_funcional_id" DROP NOT NULL;
