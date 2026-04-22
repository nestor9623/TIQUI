-- =============================================================
-- TIQUIAPP — RPC para pendientes de vacaciones (manager/admin)
-- Objetivo: evitar problemas de visibilidad por RLS en cliente
-- =============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.get_pending_vacation_requests_for_reviewer()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  manager_id uuid,
  vacation_type text,
  start_date date,
  end_date date,
  days_count integer,
  notes text,
  status public.vacation_request_status,
  manager_comment text,
  created_at timestamptz,
  updated_at timestamptz,
  user_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_value text;
BEGIN
  role_value := public.get_my_role();

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF role_value NOT IN ('manager', 'admin') THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    vr.id,
    vr.user_id,
    vr.manager_id,
    vr.vacation_type,
    vr.start_date,
    vr.end_date,
    vr.days_count,
    vr.notes,
    vr.status,
    vr.manager_comment,
    vr.created_at,
    vr.updated_at,
    trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) AS user_name
  FROM public.vacation_requests vr
  LEFT JOIN public.profiles p ON p.id = vr.user_id
  WHERE vr.status = 'pending'
  ORDER BY vr.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_pending_vacation_requests_for_reviewer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_pending_vacation_requests_for_reviewer() TO authenticated;

COMMIT;

-- Quick check (run logged in as manager/admin from app context):
-- select * from public.get_pending_vacation_requests_for_reviewer();
