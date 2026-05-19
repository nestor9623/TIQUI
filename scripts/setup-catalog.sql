-- =============================================================
-- Catálogos: tabla catalog_items y sus RLS policies
-- Run this in Supabase SQL Editor AFTER fix-rls-profiles.sql
-- =============================================================

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT        NOT NULL,
  code        TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (type, code)
);

DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.catalog_items'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%type%'
  LOOP
    EXECUTE format('ALTER TABLE public.catalog_items DROP CONSTRAINT IF EXISTS %I', constraint_row.conname);
  END LOOP;

  ALTER TABLE public.catalog_items
    ADD CONSTRAINT catalog_items_type_check
    CHECK (type IN ('community', 'area', 'user_type', 'profile', 'vacation_type', 'generic_combo'));
END $$;

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Solo admins gestionan catálogos
DROP POLICY IF EXISTS "catalog_all_admin" ON public.catalog_items;
CREATE POLICY "catalog_all_admin"
ON public.catalog_items FOR ALL
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

-- Cualquier autenticado puede leer (para usar los desplegables)
DROP POLICY IF EXISTS "catalog_select_authenticated" ON public.catalog_items;
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
  ('area', 'marketing',     'Marketing'),
  ('user_type', 'internal', 'Interno'),
  ('user_type', 'external', 'Externo'),
  ('profile', 'admin',      'Admin'),
  ('profile', 'developer',  'Developer'),
  ('profile', 'manager',    'Manager'),
  ('profile', 'employee',   'Employee'),
  ('profile', 'generic',    'Generico pendiente de asignacion'),
  ('vacation_type', 'current-year',      'Vacaciones año en curso'),
  ('vacation_type', 'previous-year',     'Vacaciones año anterior'),
  ('vacation_type', 'legal',             'Permiso legal'),
  ('vacation_type', 'personal',          'Asuntos personales'),
  ('vacation_type', 'legal-relocation',  'Permiso legal por mudanza'),
  ('vacation_type', 'legal-family',      'Permiso legal por causa familiar'),
  ('vacation_type', 'legal-exam',        'Permiso legal por examen'),
  ('generic_combo', 'pending-assignment', 'Pendiente de asignacion'),
  ('generic_combo', 'default-community',  'Comunidad por defecto'),
  ('generic_combo', 'default-area',       'Area por defecto')
ON CONFLICT (type, code) DO NOTHING;
