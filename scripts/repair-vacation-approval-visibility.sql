-- =============================================================
-- TIQUIAPP — Repair visibility for vacation approvals
-- Use in Supabase SQL Editor if manager/admin cannot see pending vacation requests
-- =============================================================

BEGIN;

-- 1) Ensure helper exists and is stable
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1
$$;

-- 2) Ensure RLS enabled
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

-- 3) Recreate policies for vacation_requests
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
USING (
  get_my_role() IN ('manager', 'admin')
  OR manager_id = auth.uid()
)
WITH CHECK (
  get_my_role() IN ('manager', 'admin')
  OR manager_id = auth.uid()
);

-- 4) Backfill missing manager_id from profiles for pending requests
UPDATE public.vacation_requests vr
SET manager_id = p.manager_id,
    updated_at = now()
FROM public.profiles p
WHERE vr.user_id = p.id
  AND vr.status = 'pending'
  AND vr.manager_id IS NULL
  AND p.manager_id IS NOT NULL;

COMMIT;

-- -------------------------------------------------------------
-- Diagnostics (run after commit)
-- -------------------------------------------------------------

-- A) Pending requests and assigned manager
SELECT vr.id, vr.user_id, vr.manager_id, vr.status, vr.start_date, vr.end_date, vr.created_at
FROM public.vacation_requests vr
WHERE vr.status = 'pending'
ORDER BY vr.created_at DESC;

-- B) Employee -> manager relation
SELECT p.id, p.email, p.role, p.manager_id
FROM public.profiles p
WHERE p.role = 'employee'
ORDER BY p.email;

-- C) Managers/admins available in profiles
SELECT p.id, p.email, p.role
FROM public.profiles p
WHERE p.role IN ('manager', 'admin')
ORDER BY p.role, p.email;
