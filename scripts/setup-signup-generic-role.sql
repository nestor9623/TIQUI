-- =============================================================
-- Registro público con Supabase + perfil genérico por defecto
-- =============================================================
-- Qué hace este script:
-- 1) Permite el nuevo rol 'generic' en profiles.role.
-- 2) Crea función/trigger para insertar profile al confirmar email.
-- 3) Asigna manager_id por defecto resolviendo siempre el mismo manager válido.
--
-- IMPORTANTE:
-- - Prioriza el manager con email 'manager@tiqui.com'.
-- - Si no existe, usa el manager activo más antiguo.
-- - Si no hay managers, usa el admin activo más antiguo.
-- - Si no hay ninguno, manager_id queda NULL.
-- =============================================================

DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', constraint_row.conname);
  END LOOP;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('admin', 'manager', 'employee', 'generic'));
END $$;

CREATE OR REPLACE FUNCTION public.handle_signup_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_manager_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Resuelve un manager fijo de forma determinista.
  SELECT p.id
  INTO v_default_manager_id
  FROM public.profiles p
  WHERE p.active = true
    AND p.role IN ('manager', 'admin')
  ORDER BY
    CASE
      WHEN p.email = 'manager@tiqui.com' THEN 0
      WHEN p.role = 'manager' THEN 1
      ELSE 2
    END,
    p.created_at ASC,
    p.id ASC
  LIMIT 1;

  v_first_name := COALESCE(new.raw_user_meta_data ->> 'first_name', 'Nuevo');
  v_last_name := COALESCE(new.raw_user_meta_data ->> 'last_name', 'Usuario');

  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    active,
    is_team_leader,
    manager_id,
    community,
    area,
    weekly_hours_target,
    vacation_dates,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    v_first_name,
    v_last_name,
    'generic',
    true,
    false,
    v_default_manager_id,
    'madrid',
    NULL,
    40,
    ARRAY[]::text[],
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(NULLIF(public.profiles.first_name, ''), EXCLUDED.first_name),
    last_name = COALESCE(NULLIF(public.profiles.last_name, ''), EXCLUDED.last_name),
    updated_at = now();

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_user_created_profile ON auth.users;
CREATE TRIGGER trg_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_signup_profile();

-- Política opcional para que el propio usuario recién creado pueda leer su perfil
-- (si no existe ya una policy equivalente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'profiles_select_own'
  ) THEN
    CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());
  END IF;
END $$;
