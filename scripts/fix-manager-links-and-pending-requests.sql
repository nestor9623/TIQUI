-- =============================================================
-- TIQUIAPP — Saneamiento de relaciones manager y pendientes
-- Objetivo:
--  1) Asegurar manager_id en profiles de empleados activos
--  2) Rellenar manager_id faltante en vacation_requests pendientes
--  3) Rellenar manager_id faltante en fichajes PENDING
--  4) Verificar resultados
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- A) Resolver IDs de managers conocidos por email (seed)
-- -------------------------------------------------------------
WITH manager_ids AS (
  SELECT
    (
      SELECT p1.id
      FROM public.profiles p1
      WHERE p1.email = 'manager@tiqui.com'
      LIMIT 1
    ) AS manager_1_id,
    (
      SELECT p2.id
      FROM public.profiles p2
      WHERE p2.email = 'manager2@tiqui.com'
      LIMIT 1
    ) AS manager_2_id
)

-- -------------------------------------------------------------
-- B) Asignar manager_id a empleados activos sin manager
--    Regla segura:
--      - comunidades madrid/galicia -> manager@tiqui.com
--      - fallback -> manager2@tiqui.com
-- -------------------------------------------------------------
UPDATE public.profiles p
SET manager_id = CASE
  WHEN p.community IN ('madrid', 'galicia') THEN m.manager_1_id
  ELSE m.manager_2_id
END
FROM manager_ids m
WHERE p.role = 'employee'
  AND p.active = true
  AND p.manager_id IS NULL
  AND p.id <> COALESCE(m.manager_1_id, '00000000-0000-0000-0000-000000000000'::uuid)
  AND p.id <> COALESCE(m.manager_2_id, '00000000-0000-0000-0000-000000000000'::uuid);

-- -------------------------------------------------------------
-- C) Backfill manager_id en vacation_requests pendientes
-- -------------------------------------------------------------
UPDATE public.vacation_requests vr
SET manager_id = p.manager_id,
    updated_at = now()
FROM public.profiles p
WHERE vr.user_id = p.id
  AND vr.status = 'pending'
  AND vr.manager_id IS NULL
  AND p.manager_id IS NOT NULL;

-- -------------------------------------------------------------
-- D) Backfill manager_id en fichajes pendientes
-- -------------------------------------------------------------
UPDATE public.fichajes f
SET manager_id = p.manager_id,
    updated_at = now()
FROM public.profiles p
WHERE f.user_id = p.id
  AND f.status = 'PENDING'
  AND f.manager_id IS NULL
  AND p.manager_id IS NOT NULL;

COMMIT;

-- =============================================================
-- VERIFICACIÓN
-- =============================================================

-- 1) Empleados activos sin manager
SELECT id, email, first_name, last_name, community, manager_id
FROM public.profiles
WHERE role = 'employee'
  AND active = true
  AND manager_id IS NULL
ORDER BY email;

-- 2) Solicitudes de vacaciones pendientes sin manager
SELECT id, user_id, manager_id, start_date, end_date, status
FROM public.vacation_requests
WHERE status = 'pending'
  AND manager_id IS NULL
ORDER BY created_at DESC;

-- 3) Fichajes pendientes sin manager
SELECT id, user_id, manager_id, date_iso, hours, status
FROM public.fichajes
WHERE status = 'PENDING'
  AND manager_id IS NULL
ORDER BY submitted_at DESC;

-- 4) Resumen de pendientes por manager
SELECT p.email AS manager_email, COUNT(*) AS pending_vacations
FROM public.vacation_requests vr
LEFT JOIN public.profiles p ON p.id = vr.manager_id
WHERE vr.status = 'pending'
GROUP BY p.email
ORDER BY pending_vacations DESC;

SELECT p.email AS manager_email, COUNT(*) AS pending_fichajes
FROM public.fichajes f
LEFT JOIN public.profiles p ON p.id = f.manager_id
WHERE f.status = 'PENDING'
GROUP BY p.email
ORDER BY pending_fichajes DESC;
