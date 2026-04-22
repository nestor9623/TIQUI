-- =============================================================
-- HOTFIX: get_vacation_balances_for_user
-- Corrige ambigüedad de "code" y asegura cálculo real de consumo
-- Ejecutar en Supabase SQL Editor
-- =============================================================

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
  IF auth.uid() != p_user_id AND get_my_role() NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  RETURN QUERY
  WITH effective_totals AS (
    SELECT
      vtc.code,
      vtc.label,
      vtc.is_annual,
      vtc.expires_month,
      vtc.sort_order,
      COALESCE(
        vyb.total_days,
        CASE
          WHEN vtc.code = 'previous-year' THEN 0
          ELSE vtc.days_per_year
        END
      ) AS total_days
    FROM public.vacation_type_catalog vtc
    LEFT JOIN public.vacation_year_balance vyb
      ON  vyb.user_id   = p_user_id
      AND vyb.type_code = vtc.code
      AND vyb.year = CASE
            WHEN vtc.code = 'previous-year' THEN v_year - 1
            ELSE v_year
          END
    WHERE vtc.active = true
      AND NOT (vtc.code = 'previous-year' AND v_month > 3)
  ),
  consumed AS (
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
    COALESCE(c.used_days, 0)                               AS used_days,
    GREATEST(0, et.total_days - COALESCE(c.used_days, 0)) AS available_days,
    et.expires_month,
    et.is_annual
  FROM effective_totals et
  LEFT JOIN consumed c ON c.type_code = et.code
  ORDER BY et.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_vacation_balances_for_user TO authenticated;

-- Verificación rápida (reemplaza con tu UUID real):
-- SELECT * FROM public.get_vacation_balances_for_user('TU-USER-ID-UUID');
