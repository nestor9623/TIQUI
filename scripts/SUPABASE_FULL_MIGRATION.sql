-- =============================================================
-- TIQUIAPP — MIGRACIÓN COMPLETA SUPABASE
-- Ejecutar EN ESTE ORDEN en el SQL Editor de Supabase
-- =============================================================
-- PASO 1 → fix-rls-profiles.sql
-- PASO 2 → setup-catalog.sql
-- PASO 3 → setup-azure-teamleaders-vacaciones.sql
-- PASO 4 → team-leader-requests.sql  (NUEVO)
-- =============================================================
-- Puedes ejecutar cada bloque por separado o este archivo completo
-- de una sola vez. Si alguna tabla ya existe, los CREATE TABLE
-- IF NOT EXISTS y ALTER ... IF NOT EXISTS son seguros de relanzar.
-- =============================================================


-- ───────────────────────────────────────────────────────────────
-- PASO 1 — RLS PROFILES (fix recursión + helper get_my_role)
-- ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

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

CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "profiles_select_team"
ON public.profiles FOR SELECT
USING (manager_id = auth.uid());

CREATE POLICY "profiles_all_admin"
ON public.profiles FOR ALL
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

CREATE POLICY "profiles_update_team"
ON public.profiles FOR UPDATE
USING (manager_id = auth.uid())
WITH CHECK (manager_id = auth.uid());

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());


-- ───────────────────────────────────────────────────────────────
-- PASO 2 — CATÁLOGOS (catalog_items)
-- ───────────────────────────────────────────────────────────────

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

DROP POLICY IF EXISTS "catalog_all_admin" ON public.catalog_items;
CREATE POLICY "catalog_all_admin"
ON public.catalog_items FOR ALL
USING (get_my_role() = 'admin')
WITH CHECK (get_my_role() = 'admin');

DROP POLICY IF EXISTS "catalog_select_authenticated" ON public.catalog_items;
CREATE POLICY "catalog_select_authenticated"
ON public.catalog_items FOR SELECT
USING (auth.uid() IS NOT NULL);

INSERT INTO public.catalog_items (type, code, name) VALUES
  ('community', 'madrid',    'Comunidad de Madrid'),
  ('community', 'galicia',   'Galicia'),
  ('community', 'cataluna',  'Cataluña'),
  ('community', 'andalucia', 'Andalucía'),
  ('area', 'desarrollo',     'Desarrollo'),
  ('area', 'operaciones',    'Operaciones'),
  ('area', 'rrhh',           'Recursos Humanos'),
  ('area', 'direccion',      'Dirección'),
  ('area', 'marketing',      'Marketing')
ON CONFLICT (type, code) DO NOTHING;


-- ───────────────────────────────────────────────────────────────
-- PASO 3 — AZURE INTEGRATIONS + TEAM LEADERS + VACACIONES
-- ───────────────────────────────────────────────────────────────

-- 3a) Flag is_team_leader en profiles
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS is_team_leader BOOLEAN NOT NULL DEFAULT false;

-- 3b) User integrations (Azure / Microsoft 365)
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider            TEXT        NOT NULL CHECK (provider IN ('azure-devops', 'microsoft-365')),
  external_user_id    TEXT,
  tenant_id           TEXT,
  connection_status   TEXT        NOT NULL DEFAULT 'connected'
                                  CHECK (connection_status IN ('connected', 'error', 'expired', 'revoked')),
  access_token        TEXT,
  refresh_token       TEXT,
  token_expires_at    TIMESTAMPTZ,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- 3c) Team leader assignments
CREATE TABLE IF NOT EXISTS public.team_leader_assignments (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_leader_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by             UUID        NOT NULL REFERENCES auth.users(id),
  status                  TEXT        NOT NULL DEFAULT 'active'
                                      CHECK (status IN ('active', 'pending_change', 'inactive')),
  requested_team_leader_id UUID       REFERENCES auth.users(id),
  request_note            TEXT,
  manager_decision_note   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id)
);

-- 3d) Vacation requests (enum + tabla)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vacation_request_status') THEN
    CREATE TYPE public.vacation_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id      UUID        REFERENCES auth.users(id),
  vacation_type   TEXT        NOT NULL CHECK (vacation_type IN ('current-year', 'previous-year', 'legal')),
  start_date      DATE        NOT NULL,
  end_date        DATE        NOT NULL,
  days_count      INT         NOT NULL CHECK (days_count > 0),
  notes           TEXT,
  status          public.vacation_request_status NOT NULL DEFAULT 'pending',
  manager_comment TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vacation_requests_dates_chk CHECK (start_date <= end_date)
);

-- 3e) Trigger helper set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_integrations_updated_at      ON public.user_integrations;
DROP TRIGGER IF EXISTS trg_team_leader_assignments_updated_at ON public.team_leader_assignments;
DROP TRIGGER IF EXISTS trg_vacation_requests_updated_at       ON public.vacation_requests;

CREATE TRIGGER trg_user_integrations_updated_at
BEFORE UPDATE ON public.user_integrations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_team_leader_assignments_updated_at
BEFORE UPDATE ON public.team_leader_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_vacation_requests_updated_at
BEFORE UPDATE ON public.vacation_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3f) RLS enable
ALTER TABLE public.user_integrations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_leader_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_requests         ENABLE ROW LEVEL SECURITY;

-- 3g) Policies: user_integrations
DROP POLICY IF EXISTS user_integrations_select_own ON public.user_integrations;
CREATE POLICY user_integrations_select_own
ON public.user_integrations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_integrations_upsert_own ON public.user_integrations;
CREATE POLICY user_integrations_upsert_own
ON public.user_integrations FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3h) Policies: team_leader_assignments
DROP POLICY IF EXISTS team_assignments_select_own ON public.team_leader_assignments;
CREATE POLICY team_assignments_select_own
ON public.team_leader_assignments FOR SELECT TO authenticated
USING (auth.uid() = employee_id OR auth.uid() = team_leader_id);

DROP POLICY IF EXISTS team_assignments_manage_manager_admin ON public.team_leader_assignments;
CREATE POLICY team_assignments_manage_manager_admin
ON public.team_leader_assignments FOR ALL TO authenticated
USING   (get_my_role() IN ('manager', 'admin'))
WITH CHECK (get_my_role() IN ('manager', 'admin'));

-- 3i) Policies: vacation_requests
DROP POLICY IF EXISTS vacation_requests_select_own ON public.vacation_requests;
CREATE POLICY vacation_requests_select_own
ON public.vacation_requests FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS vacation_requests_insert_own ON public.vacation_requests;
CREATE POLICY vacation_requests_insert_own
ON public.vacation_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS vacation_requests_update_own_pending ON public.vacation_requests;
CREATE POLICY vacation_requests_update_own_pending
ON public.vacation_requests FOR UPDATE TO authenticated
USING  (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS vacation_requests_manager_review ON public.vacation_requests;
CREATE POLICY vacation_requests_manager_review
ON public.vacation_requests FOR ALL TO authenticated
USING   (get_my_role() IN ('manager', 'admin'))
WITH CHECK (get_my_role() IN ('manager', 'admin'));


-- ───────────────────────────────────────────────────────────────
-- PASO 4 — SOLICITUDES DE TEAM LEADER (team_leader_requests)
-- ───────────────────────────────────────────────────────────────
-- Esta tabla recoge las solicitudes que un TL envía al manager
-- para incorporar o reasignar a un empleado a su equipo.
-- El manager las aprueba/rechaza y eso actualiza team_leader_assignments.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tl_request_type') THEN
    CREATE TYPE public.tl_request_type AS ENUM ('assignment', 'reassignment');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tl_request_status') THEN
    CREATE TYPE public.tl_request_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.team_leader_requests (
  id                      UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Team leader que hace la solicitud
  requester_id            UUID                   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Empleado que se quiere incorporar o reasignar
  employee_id             UUID                   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- TL de destino (normalmente el propio requester)
  target_team_leader_id   UUID                   NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Tipo: 'assignment' (sin TL previo) | 'reassignment' (ya tiene TL)
  request_type            public.tl_request_type NOT NULL DEFAULT 'assignment',
  -- Nota opcional del TL solicitante
  request_note            TEXT,
  -- Estado del manager
  status                  public.tl_request_status NOT NULL DEFAULT 'pending',
  -- Manager que resuelve la solicitud
  resolved_by             UUID                   REFERENCES auth.users(id),
  manager_comment         TEXT,
  resolved_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ            NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_tl_requests_updated_at ON public.team_leader_requests;
CREATE TRIGGER trg_tl_requests_updated_at
BEFORE UPDATE ON public.team_leader_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.team_leader_requests ENABLE ROW LEVEL SECURITY;

-- TL puede ver y crear sus propias solicitudes
DROP POLICY IF EXISTS tl_requests_select_own ON public.team_leader_requests;
CREATE POLICY tl_requests_select_own
ON public.team_leader_requests FOR SELECT TO authenticated
USING (auth.uid() = requester_id);

DROP POLICY IF EXISTS tl_requests_insert_own ON public.team_leader_requests;
CREATE POLICY tl_requests_insert_own
ON public.team_leader_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_id);

-- Manager/Admin ven y gestionan todas las solicitudes
DROP POLICY IF EXISTS tl_requests_manage_manager_admin ON public.team_leader_requests;
CREATE POLICY tl_requests_manage_manager_admin
ON public.team_leader_requests FOR ALL TO authenticated
USING   (get_my_role() IN ('manager', 'admin'))
WITH CHECK (get_my_role() IN ('manager', 'admin'));


-- ───────────────────────────────────────────────────────────────
-- PASO 5 — ÍNDICES DE RENDIMIENTO (opcionales pero recomendados)
-- ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tla_employee      ON public.team_leader_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_tla_team_leader   ON public.team_leader_assignments(team_leader_id);
CREATE INDEX IF NOT EXISTS idx_tlr_requester     ON public.team_leader_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_tlr_employee      ON public.team_leader_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_tlr_status        ON public.team_leader_requests(status);
CREATE INDEX IF NOT EXISTS idx_vr_user           ON public.vacation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vr_manager        ON public.vacation_requests(manager_id);
CREATE INDEX IF NOT EXISTS idx_vr_status         ON public.vacation_requests(status);
CREATE INDEX IF NOT EXISTS idx_ui_user_provider  ON public.user_integrations(user_id, provider);


-- ───────────────────────────────────────────────────────────────
-- VERIFICACIÓN FINAL
-- Ejecuta esto al final para confirmar que todo se creó bien
-- ───────────────────────────────────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'catalog_items',
    'user_integrations',
    'team_leader_assignments',
    'team_leader_requests',
    'vacation_requests'
  )
ORDER BY table_name;
