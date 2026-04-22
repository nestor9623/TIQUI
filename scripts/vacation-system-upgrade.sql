-- ============================================================
-- VACATION SYSTEM UPGRADE
-- Ejecutar en Supabase SQL Editor (una sola vez)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. CATÁLOGO DE TIPOS DE VACACIONES / PERMISOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vacation_type_catalog (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT         NOT NULL UNIQUE,
  label         TEXT         NOT NULL,
  days_per_year INT          NOT NULL DEFAULT 0,
  description   TEXT,
  is_annual     BOOLEAN      NOT NULL DEFAULT true,
  -- Para tipos anuales: mes máximo de disfrute (NULL = sin límite)
  -- 12 = hasta dic del año actual, 3 = hasta marzo del año siguiente
  expires_month INT          CHECK (expires_month BETWEEN 1 AND 12),
  sort_order    INT          NOT NULL DEFAULT 99,
  active        BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO public.vacation_type_catalog
  (code, label, days_per_year, description, is_annual, expires_month, sort_order)
VALUES
  ('current-year',     'Vacaciones año actual',          22, 'Días de vacaciones del año en curso',                       true,  12, 1),
  ('previous-year',    'Remanente año anterior',          0, 'Días no disfrutados del año anterior (hasta marzo)',         true,   3, 2),
  ('personal',         'Asuntos personales',              3, 'Días de asuntos propios',                                    true,  12, 3),
  ('legal-relocation', 'Traslado de domicilio',           2, 'Permiso retribuido por cambio de domicilio habitual',        false, NULL,4),
  ('legal-family',     'Permiso familiar',                2, 'Hospitalización, fallecimiento o enfermedad grave familiar',  false, NULL,5),
  ('legal-exam',       'Permiso examen oficial',          1, 'Asistencia a examen en centro oficial',                      false, NULL,6)
ON CONFLICT (code) DO UPDATE SET
  label         = EXCLUDED.label,
  days_per_year = EXCLUDED.days_per_year,
  description   = EXCLUDED.description,
  is_annual     = EXCLUDED.is_annual,
  expires_month = EXCLUDED.expires_month,
  sort_order    = EXCLUDED.sort_order;

ALTER TABLE public.vacation_type_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vtc_select_auth"   ON public.vacation_type_catalog;
DROP POLICY IF EXISTS "vtc_all_admin"     ON public.vacation_type_catalog;
CREATE POLICY "vtc_select_auth"   ON public.vacation_type_catalog FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "vtc_all_admin"     ON public.vacation_type_catalog FOR ALL    USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA DE FESTIVOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.holidays (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  date        DATE    NOT NULL,
  name        TEXT    NOT NULL,
  scope       TEXT    NOT NULL CHECK (scope IN ('national', 'community')),
  community   TEXT,   -- NULL = nacional
  year        INT     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS holidays_date_community_uidx
  ON public.holidays (date, COALESCE(community, ''));

-- Nacionales 2026
INSERT INTO public.holidays (date, name, scope, community, year) VALUES
  ('2026-01-01', 'Año Nuevo',                    'national', NULL,      2026),
  ('2026-01-06', 'Epifanía del Señor (Reyes)',   'national', NULL,      2026),
  ('2026-04-02', 'Jueves Santo',                 'national', NULL,      2026),
  ('2026-04-03', 'Viernes Santo',                'national', NULL,      2026),
  ('2026-05-01', 'Día del Trabajo',              'national', NULL,      2026),
  ('2026-08-15', 'Asunción de la Virgen',        'national', NULL,      2026),
  ('2026-10-12', 'Día de la Hispanidad',         'national', NULL,      2026),
  ('2026-11-01', 'Todos los Santos',             'national', NULL,      2026),
  ('2026-12-06', 'Día de la Constitución',       'national', NULL,      2026),
  ('2026-12-08', 'Inmaculada Concepción',        'national', NULL,      2026),
  ('2026-12-25', 'Navidad',                      'national', NULL,      2026)
ON CONFLICT (date, COALESCE(community, '')) DO NOTHING;

-- Comunidad de Madrid 2026
INSERT INTO public.holidays (date, name, scope, community, year) VALUES
  ('2026-03-19', 'San José',                     'community', 'madrid', 2026),
  ('2026-05-02', 'Fiesta de la Comunidad',       'community', 'madrid', 2026),
  ('2026-11-09', 'Virgen de la Almudena',        'community', 'madrid', 2026)
ON CONFLICT (date, COALESCE(community, '')) DO NOTHING;

-- Galicia 2026
INSERT INTO public.holidays (date, name, scope, community, year) VALUES
  ('2026-05-17', 'Día das Letras Galegas',       'community', 'galicia', 2026),
  ('2026-07-25', 'Día Nacional de Galicia',      'community', 'galicia', 2026),
  ('2026-08-16', 'San Roque (A Coruña)',         'community', 'galicia', 2026)
ON CONFLICT (date, COALESCE(community, '')) DO NOTHING;

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "holidays_select_auth" ON public.holidays;
DROP POLICY IF EXISTS "holidays_all_admin"   ON public.holidays;
CREATE POLICY "holidays_select_auth" ON public.holidays FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "holidays_all_admin"   ON public.holidays FOR ALL    USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 3. BALANCE ANUAL POR EMPLEADO
-- Permite sobreescribir días totales por empleado/año/tipo.
-- Si no hay fila, se usa vacation_type_catalog.days_per_year.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vacation_year_balance (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year        INT     NOT NULL,
  type_code   TEXT    NOT NULL REFERENCES public.vacation_type_catalog(code),
  total_days  INT     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, year, type_code)
);

ALTER TABLE public.vacation_year_balance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vyb_select_own"   ON public.vacation_year_balance;
DROP POLICY IF EXISTS "vyb_all_admin"    ON public.vacation_year_balance;
CREATE POLICY "vyb_select_own" ON public.vacation_year_balance FOR SELECT USING (auth.uid() = user_id OR get_my_role() IN ('admin','manager'));
CREATE POLICY "vyb_all_admin"  ON public.vacation_year_balance FOR ALL    USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 4. ELIMINAR CHECK HARDCODEADO EN vacation_requests
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.vacation_requests
  DROP CONSTRAINT IF EXISTS vacation_requests_vacation_type_check;

-- Añadir nuevos tipos permitidos de forma dinámica (soft reference al catálogo)
-- No añadimos FK para permitir migraciones incrementales sin downtime.

-- ─────────────────────────────────────────────────────────────
-- 5. RPC: festivos para una comunidad (nacional + autonómicos)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_holidays_for_community(
  p_community TEXT,
  p_year      INT DEFAULT NULL
)
RETURNS TABLE (date DATE, name TEXT, scope TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.date, h.name, h.scope
  FROM public.holidays h
  WHERE (p_year IS NULL OR h.year = p_year)
    AND (h.community IS NULL OR h.community = p_community)
  ORDER BY h.date;
$$;

GRANT EXECUTE ON FUNCTION public.get_holidays_for_community TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 6. RPC: balance de vacaciones para un empleado
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_vacation_balances_for_user(
  p_user_id UUID
)
RETURNS TABLE (
  code            TEXT,
  label           TEXT,
  total_days      INT,
  used_days       INT,
  available_days  INT,
  expires_month   INT,
  is_annual       BOOLEAN
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year  INT := EXTRACT(YEAR  FROM CURRENT_DATE)::INT;
  v_month INT := EXTRACT(MONTH FROM CURRENT_DATE)::INT;
BEGIN
  -- Solo el propio usuario, su manager o admin
  IF auth.uid() != p_user_id AND get_my_role() NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  RETURN QUERY
  WITH effective_totals AS (
    -- Para cada tipo activo del catálogo, el total = override por empleado/año si existe,
    -- sino el valor por defecto del catálogo.
    SELECT
      vtc.code,
      vtc.label,
      vtc.is_annual,
      vtc.expires_month,
      vtc.sort_order,
      COALESCE(
        vyb.total_days,
        CASE
          -- previous-year: default 0; lo pone RRHH en vacation_year_balance
          WHEN vtc.code = 'previous-year' THEN 0
          ELSE vtc.days_per_year
        END
      ) AS total_days
    FROM public.vacation_type_catalog vtc
    LEFT JOIN public.vacation_year_balance vyb
      ON  vyb.user_id   = p_user_id
      AND vyb.type_code = vtc.code
      AND vyb.year = CASE
            -- previous-year: el balance pertenece al año pasado
            WHEN vtc.code = 'previous-year' THEN v_year - 1
            ELSE v_year
          END
    WHERE vtc.active = true
      -- Ocultar previous-year después de marzo
      AND NOT (vtc.code = 'previous-year' AND v_month > 3)
  ),
  consumed AS (
    -- Días consumidos (aprobados o pendientes) en este año natural
    SELECT
      vr.vacation_type AS type_code,
      COALESCE(SUM(vr.days_count), 0)::INT AS used_days
    FROM public.vacation_requests vr
    WHERE vr.user_id = p_user_id
      AND vr.status IN ('approved', 'pending')
      AND EXTRACT(YEAR FROM vr.start_date::DATE) = v_year
    GROUP BY vr.vacation_type
  )
  SELECT
    et.code,
    et.label,
    et.total_days,
    COALESCE(c.used_days, 0)                              AS used_days,
    GREATEST(0, et.total_days - COALESCE(c.used_days, 0)) AS available_days,
    et.expires_month,
    et.is_annual
  FROM effective_totals et
  LEFT JOIN consumed c ON c.type_code = et.code
  ORDER BY et.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vacation_balances_for_user TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 7. RPC: comprobar solapamiento de vacaciones
-- Devuelve las solicitudes activas (approved/pending) que se solapan
-- con el rango dado para el usuario.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_vacation_overlap(
  p_user_id   UUID,
  p_start     DATE,
  p_end       DATE,
  p_exclude_id UUID DEFAULT NULL  -- ignorar una solicitud concreta (para edición)
)
RETURNS TABLE (
  id          UUID,
  start_date  DATE,
  end_date    DATE,
  status      TEXT,
  days_count  INT
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vr.id, vr.start_date::DATE, vr.end_date::DATE, vr.status::TEXT, vr.days_count
  FROM public.vacation_requests vr
  WHERE vr.user_id = p_user_id
    AND vr.status IN ('approved', 'pending')
    AND vr.start_date::DATE <= p_end
    AND vr.end_date::DATE   >= p_start
    AND (p_exclude_id IS NULL OR vr.id != p_exclude_id);
$$;

GRANT EXECUTE ON FUNCTION public.check_vacation_overlap TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 8. RPC: ¿está el empleado de vacaciones en una fecha dada?
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_user_on_vacation(
  p_user_id UUID,
  p_date    DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vacation_requests
    WHERE user_id = p_user_id
      AND status = 'approved'
      AND start_date::DATE <= p_date
      AND end_date::DATE   >= p_date
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_user_on_vacation TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- FIN
-- ─────────────────────────────────────────────────────────────
-- Tras ejecutar este script, ejecuta también scripts/seed-vacation-balances.mjs
-- para inicializar los balances del año anterior para los usuarios existentes.
