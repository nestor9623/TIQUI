-- =============================================================
-- Catálogos: tabla catalog_items y sus RLS policies
-- Run this in Supabase SQL Editor AFTER fix-rls-profiles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL CHECK (type IN ('community', 'area')),
  code        TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, code)
);

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Solo admins gestionan catálogos
CREATE POLICY "catalog_all_admin"
ON public.catalog_items FOR ALL
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

-- Cualquier autenticado puede leer (para usar los desplegables)
CREATE POLICY "catalog_select_authenticated"
ON public.catalog_items FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Seed inicial
INSERT INTO public.catalog_items (type, code, name) VALUES
  ('community', 'madrid',   'Comunidad de Madrid'),
  ('community', 'galicia',  'Galicia'),
  ('community', 'cataluna', 'Cataluña'),
  ('community', 'andalucia','Andalucía'),
  ('area', 'desarrollo',    'Desarrollo'),
  ('area', 'operaciones',   'Operaciones'),
  ('area', 'rrhh',          'Recursos Humanos'),
  ('area', 'direccion',     'Dirección'),
  ('area', 'marketing',     'Marketing')
ON CONFLICT (type, code) DO NOTHING;
