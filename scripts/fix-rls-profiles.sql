-- =============================================================
-- Fix: infinite recursion in RLS policies on profiles table
-- Run this in Supabase SQL Editor
-- =============================================================

-- Step 1: helper SECURITY DEFINER que lee el rol SIN activar RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Step 2: eliminar todas las policies actuales en profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- Step 3: recrear policies sin recursión

-- Cualquier usuario autenticado puede leer su propio perfil
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Managers ven a su equipo
CREATE POLICY "profiles_select_team"
ON public.profiles FOR SELECT
USING (manager_id = auth.uid());

-- Admins ven y modifican todo
CREATE POLICY "profiles_all_admin"
ON public.profiles FOR ALL
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

-- Managers pueden actualizar perfiles de su equipo
CREATE POLICY "profiles_update_team"
ON public.profiles FOR UPDATE
USING (manager_id = auth.uid())
WITH CHECK (manager_id = auth.uid());

-- El propio usuario puede actualizar su perfil
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
