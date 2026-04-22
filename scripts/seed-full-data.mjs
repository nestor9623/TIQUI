/**
 * seed-full-data.mjs
 * Seed completo de TiquiApp:
 *   - 2 admins  (1 ya existe: admin@tiqui.com)
 *   - 2 managers (1 ya existe: manager@tiqui.com)
 *   - 2 team leaders (employees con is_team_leader=true)
 *   - 4 employees normales (1 ya existe: employee@tiqui.com)
 *   + datos de fichaje de Mayo 2026 para todos
 *
 * USO:
 *   SERVICE_ROLE_KEY=<key> node scripts/seed-full-data.mjs
 *
 * Los 3 usuarios de prueba originales se detectan y no se recrean.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tlccknpjfcxelncrdieh.supabase.co';
const SERVICE_ROLE_KEY = process.env['SERVICE_ROLE_KEY'];

if (!SERVICE_ROLE_KEY) {
  console.error('❌  Falta SERVICE_ROLE_KEY');
  console.error('   SERVICE_ROLE_KEY=<key> node scripts/seed-full-data.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const normalized = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

async function validateServiceRoleKey() {
  const payload = decodeJwtPayload(SERVICE_ROLE_KEY);
  if (!payload || payload.role !== 'service_role') {
    console.error('❌  La key no parece ser SERVICE ROLE (payload.role != service_role).');
    console.error('   Usa Settings -> API -> Project API keys -> service_role (secret).');
    process.exit(1);
  }

  const { error } = await supabase.auth.admin.listUsers({ perPage: 1 });
  if (error) {
    console.error(`❌  SERVICE_ROLE_KEY inválida o revocada: ${error.message}`);
    console.error('   Genera una nueva service_role key en Supabase y vuelve a ejecutar el script.');
    process.exit(1);
  }
}

// ─── Definición de usuarios ────────────────────────────────────────────────────
const NEW_USERS = [
  // ── Admin extra ──────────────────────────────────────────────────────────────
  {
    email: 'superadmin@tiqui.com',
    password: 'Admin123!',
    profile: {
      first_name: 'Elena',
      last_name: 'Vázquez',
      role: 'admin',
      is_team_leader: false,
      active: true,
      area: 'direccion',
      address: 'Paseo de la Castellana 200, Madrid',
      community: 'madrid',
      weekly_hours_target: 40,
    },
  },
  // ── Manager extra ─────────────────────────────────────────────────────────────
  {
    email: 'manager2@tiqui.com',
    password: 'Manager123!',
    profile: {
      first_name: 'Carlos',
      last_name: 'Ríos',
      role: 'manager',
      is_team_leader: false,
      active: true,
      area: 'desarrollo',
      address: 'Av. Diagonal 120, Barcelona',
      community: 'madrid',
      weekly_hours_target: 40,
    },
  },
  // ── Team Leaders (employees con is_team_leader=true) ──────────────────────────
  {
    email: 'tl1@tiqui.com',
    password: 'Employee123!',
    profile: {
      first_name: 'Lucía',
      last_name: 'Fernández',
      role: 'employee',
      is_team_leader: true,
      active: true,
      area: 'desarrollo',
      address: 'Calle Fuencarral 88, Madrid',
      community: 'madrid',
      weekly_hours_target: 40,
    },
  },
  {
    email: 'tl2@tiqui.com',
    password: 'Employee123!',
    profile: {
      first_name: 'Marcos',
      last_name: 'Ortega',
      role: 'employee',
      is_team_leader: true,
      active: true,
      area: 'operaciones',
      address: 'Rúa do Franco 14, Santiago de Compostela',
      community: 'galicia',
      weekly_hours_target: 40,
    },
  },
  // ── Employees normales ────────────────────────────────────────────────────────
  {
    email: 'emp1@tiqui.com',
    password: 'Employee123!',
    profile: {
      first_name: 'Sofía',
      last_name: 'Moreno',
      role: 'employee',
      is_team_leader: false,
      active: true,
      area: 'desarrollo',
      address: 'Calle Sierpes 5, Sevilla',
      community: 'galicia',
      weekly_hours_target: 40,
    },
  },
  {
    email: 'emp2@tiqui.com',
    password: 'Employee123!',
    profile: {
      first_name: 'Diego',
      last_name: 'Castro',
      role: 'employee',
      is_team_leader: false,
      active: true,
      area: 'rrhh',
      address: 'Calle Gran Vía 55, Madrid',
      community: 'madrid',
      weekly_hours_target: 40,
    },
  },
  {
    email: 'emp3@tiqui.com',
    password: 'Employee123!',
    profile: {
      first_name: 'Paula',
      last_name: 'Iglesias',
      role: 'employee',
      is_team_leader: false,
      active: true,
      area: 'marketing',
      address: 'Paseo de Gracia 34, Barcelona',
      community: 'madrid',
      weekly_hours_target: 40,
    },
  },
];

const ALLOWED_COMMUNITIES = new Set(['madrid', 'galicia']);

function normalizeCommunity(community, email) {
  if (community && ALLOWED_COMMUNITIES.has(community)) return community;
  if (community) {
    console.warn(`   ⚠️  community '${community}' no permitida para ${email}; usando 'madrid'.`);
  }
  return 'madrid';
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Returns true if a date (month 1-indexed) is weekend */
function isWeekend(year, month, day) {
  const d = new Date(year, month - 1, day);
  return d.getDay() === 0 || d.getDay() === 6;
}

/** Working weekdays in May 2026 (Mon–Fri), skip 1 May (festivo) */
const MAY_HOLIDAYS = ['2026-05-01']; // Día del Trabajo
function workdaysOfMay2026() {
  const days = [];
  for (let d = 1; d <= 31; d++) {
    const iso = isoDate(2026, 5, d);
    if (!isWeekend(2026, 5, d) && !MAY_HOLIDAYS.includes(iso)) days.push({ day: d, iso });
  }
  return days;
}

/**
 * Builds a randomised set of timeline events + report stats for one working day.
 * variant: 'full' | 'short' | 'pause' | 'missing'
 */
function buildDayData(userId, dateIso, reportId, variant = 'full') {
  if (variant === 'missing') return null; // dia sin fichar

  const events = [];
  let workedMinutes = 0;

  if (variant === 'full') {
    // 08:30 entrada → 13:00 pausa → 14:00 reanudar → 17:30 salida  (8h)
    events.push({ report_id: reportId, user_id: userId, event_type: 'in',    timestamp: `${dateIso}T08:30:00`, description: 'Entrada' });
    events.push({ report_id: reportId, user_id: userId, event_type: 'pause', timestamp: `${dateIso}T13:00:00`, description: 'Pausa comida' });
    events.push({ report_id: reportId, user_id: userId, event_type: 'in',    timestamp: `${dateIso}T14:00:00`, description: 'Reanudar' });
    events.push({ report_id: reportId, user_id: userId, event_type: 'out',   timestamp: `${dateIso}T17:30:00`, description: 'Salida' });
    workedMinutes = (13 * 60 - 8 * 60 - 30) + (17 * 60 + 30 - 14 * 60); // 4h30 + 3h30 = 8h
  } else if (variant === 'short') {
    // 09:00 entrada → 14:00 salida (5h)
    events.push({ report_id: reportId, user_id: userId, event_type: 'in',  timestamp: `${dateIso}T09:00:00`, description: 'Entrada' });
    events.push({ report_id: reportId, user_id: userId, event_type: 'out', timestamp: `${dateIso}T14:00:00`, description: 'Salida anticipada' });
    workedMinutes = 5 * 60;
  } else if (variant === 'pause') {
    // 08:00 entrada → 12:30 pausa (aun en pausa, no ha reanudado)
    events.push({ report_id: reportId, user_id: userId, event_type: 'in',    timestamp: `${dateIso}T08:00:00`, description: 'Entrada' });
    events.push({ report_id: reportId, user_id: userId, event_type: 'pause', timestamp: `${dateIso}T12:30:00`, description: 'Pausa' });
    workedMinutes = 4 * 60 + 30;
  }

  const dayStatus = variant === 'full' ? 'clocked-out'
    : variant === 'short' ? 'clocked-out'
    : 'on-pause';

  const h = Math.floor(workedMinutes / 60);
  const m = workedMinutes % 60;
  const workedHours = `${h}h ${String(m).padStart(2, '0')}m`;

  return { events, workedMinutes, dayStatus, workedHours };
}

// ─── Seed functions ─────────────────────────────────────────────────────────────

async function getOrCreateUser(userDef) {
  // Check if already exists
  const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = listData?.users?.find(u => u.email === userDef.email);
  if (existing) {
    console.log(`   ⚠️  Ya existe: ${userDef.email} → ${existing.id}`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: userDef.email,
    password: userDef.password,
    email_confirm: true,
  });

  if (error) {
    console.error(`   ❌  Auth error para ${userDef.email}: ${error.message}`);
    return null;
  }
  console.log(`   ✅  Auth creado: ${data.user.id}`);
  return data.user.id;
}

async function upsertProfile(userId, email, profile, managerId = null) {
  const safeCommunity = normalizeCommunity(profile.community, email);
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    ...profile,
    community: safeCommunity,
    manager_id: managerId,
    vacation_dates: [],
    avatar: null,
    created_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) console.error(`   ❌  Profile error: ${error.message}`);
  else console.log(`   ✅  Profile upserted`);
}

async function seedFichajesForUser(userId, label) {
  const workdays = workdaysOfMay2026();
  // Use days up to today (May 5 = days 1–5 minus holidays/weekends)
  const today = new Date();
  const todayIso = isoDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const pastDays = workdays.filter(wd => wd.iso <= todayIso);

  const variants = ['full', 'full', 'full', 'short', 'full', 'full', 'pause', 'full', 'full', 'missing'];

  for (let i = 0; i < pastDays.length; i++) {
    const { iso } = pastDays[i];
    const variant = variants[i % variants.length];

    if (variant === 'missing') {
      console.log(`      ⏭️  ${iso} sin fichar`);
      continue;
    }

    // 1) Create daily_report
    const { data: existingReport } = await supabase
      .from('daily_reports')
      .select('id')
      .eq('user_id', userId)
      .eq('date_iso', iso)
      .maybeSingle();

    let reportId = existingReport?.id;

    if (!reportId) {
      const { data: newReport, error: repErr } = await supabase
        .from('daily_reports')
        .insert({ user_id: userId, date_iso: iso, day_status: 'not-clocked', worked_hours: '0h 00m', total_minutes: 0 })
        .select('id')
        .single();

      if (repErr) { console.error(`      ❌  daily_report error ${iso}: ${repErr.message}`); continue; }
      reportId = newReport.id;
    }

    // 2) Build events
    const dayData = buildDayData(userId, iso, reportId, variant);
    if (!dayData) continue;

    // 3) Clear existing events to avoid duplicates
    await supabase.from('timeline_events').delete().eq('report_id', reportId);

    // 4) Insert events
    const { error: evErr } = await supabase.from('timeline_events').insert(dayData.events);
    if (evErr) { console.error(`      ❌  timeline_events error ${iso}: ${evErr.message}`); continue; }

    // 5) Update daily_report status
    await supabase.from('daily_reports').update({
      day_status: dayData.dayStatus,
      worked_hours: dayData.workedHours,
      total_minutes: dayData.workedMinutes,
    }).eq('id', reportId);

    console.log(`      ✅  ${iso} [${variant}] → ${dayData.workedHours}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  TiquiApp — Seed completo\n');

  await validateServiceRoleKey();

  // ── Paso 1: obtener IDs de los 3 usuarios existentes ─────────────────────────
  const { data: allAuthUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const findId = email => allAuthUsers?.users?.find(u => u.email === email)?.id;

  const existingAdminId   = findId('admin@tiqui.com');
  const existingManagerId = findId('manager@tiqui.com');
  const existingEmployeeId = findId('employee@tiqui.com');

  console.log('👥  Usuarios existentes:');
  console.log(`   admin@tiqui.com    → ${existingAdminId ?? '❌ NO encontrado'}`);
  console.log(`   manager@tiqui.com  → ${existingManagerId ?? '❌ NO encontrado'}`);
  console.log(`   employee@tiqui.com → ${existingEmployeeId ?? '❌ NO encontrado'}\n`);

  // Asegurar que los perfiles de los usuarios existentes tienen is_team_leader y manager_id
  if (existingAdminId) {
    await supabase.from('profiles').update({ is_team_leader: false }).eq('id', existingAdminId);
  }
  if (existingManagerId) {
    await supabase.from('profiles').update({ is_team_leader: false }).eq('id', existingManagerId);
  }
  if (existingEmployeeId && existingManagerId) {
    await supabase.from('profiles').update({ is_team_leader: false, manager_id: existingManagerId }).eq('id', existingEmployeeId);
  }

  // ── Paso 2: crear usuarios nuevos ────────────────────────────────────────────
  const createdIds = {};

  const failedUsers = [];

  for (const userDef of NEW_USERS) {
    console.log(`\n👤  Procesando: ${userDef.email}`);
    const uid = await getOrCreateUser(userDef);
    if (!uid) {
      failedUsers.push(userDef.email);
      continue;
    }
    createdIds[userDef.email] = uid;

    // manager_id: employees van con existingManagerId o manager2 según área
    let managerId = null;
    if (userDef.profile.role === 'employee') {
      // tl1, emp1, emp2 → existingManager; tl2, emp3 → manager2 (se asignará después)
      managerId = existingManagerId ?? null;
    }

    await upsertProfile(uid, userDef.email, userDef.profile, managerId);
  }

  if (failedUsers.length > 0) {
    console.error('\n❌  Se aborta el seed porque falló la creación/lectura de usuarios:');
    for (const email of failedUsers) {
      console.error(`   - ${email}`);
    }
    console.error('   Revisa la SERVICE_ROLE_KEY y vuelve a ejecutar.');
    process.exit(1);
  }

  // Reasignar manager_id de tl2 y emp3 al manager2 cuando exista
  const manager2Id = createdIds['manager2@tiqui.com'];
  if (manager2Id) {
    const tl2Id  = createdIds['tl2@tiqui.com'];
    const emp3Id = createdIds['emp3@tiqui.com'];
    if (tl2Id)  await supabase.from('profiles').update({ manager_id: manager2Id }).eq('id', tl2Id);
    if (emp3Id) await supabase.from('profiles').update({ manager_id: manager2Id }).eq('id', emp3Id);
    console.log('\n🔗  tl2 y emp3 reasignados a manager2');
  }

  // Safety net: cualquier empleado activo sin manager se asigna al manager principal
  if (existingManagerId) {
    const { error: relinkError } = await supabase
      .from('profiles')
      .update({ manager_id: existingManagerId })
      .eq('role', 'employee')
      .eq('active', true)
      .is('manager_id', null);

    if (relinkError) {
      console.error(`❌  Error asignando manager por defecto: ${relinkError.message}`);
    } else {
      console.log('🔗  Empleados activos sin manager enlazados al manager principal');
    }
  }

  // ── Paso 3: team_leader_assignments ──────────────────────────────────────────
  // tl1 → equipo: emp1, emp2, existingEmployee
  // tl2 → equipo: emp3
  const assignedById = existingAdminId ?? existingManagerId;
  const tl1Id = createdIds['tl1@tiqui.com'];
  const tl2Id = createdIds['tl2@tiqui.com'];

  async function assignToTL(employeeId, teamLeaderId) {
    if (!employeeId || !teamLeaderId || !assignedById) return;
    await supabase.from('team_leader_assignments').upsert({
      employee_id: employeeId,
      team_leader_id: teamLeaderId,
      assigned_by: assignedById,
      status: 'active',
    }, { onConflict: 'employee_id' });
  }

  if (tl1Id) {
    await assignToTL(createdIds['emp1@tiqui.com'], tl1Id);
    await assignToTL(createdIds['emp2@tiqui.com'], tl1Id);
    await assignToTL(existingEmployeeId, tl1Id);
    console.log('\n🔗  emp1, emp2, employee@tiqui → TL1 (Lucía)');
  }
  if (tl2Id) {
    await assignToTL(createdIds['emp3@tiqui.com'], tl2Id);
    console.log('🔗  emp3 → TL2 (Marcos)');
  }

  // ── Paso 4: fichajes de Mayo 2026 ────────────────────────────────────────────
  console.log('\n📅  Generando fichajes de Mayo 2026...\n');

  const allUsers = [
    { id: existingAdminId,    label: 'admin@tiqui.com' },
    { id: existingManagerId,  label: 'manager@tiqui.com' },
    { id: existingEmployeeId, label: 'employee@tiqui.com' },
    ...NEW_USERS.map(u => ({ id: createdIds[u.email], label: u.email })),
  ].filter(u => u.id);

  for (const user of allUsers) {
    console.log(`   📋  ${user.label}`);
    await seedFichajesForUser(user.id, user.label);
  }

  // ── Resumen ───────────────────────────────────────────────────────────────────
  console.log('\n✅  Seed completado.\n');
  console.log('📋  Credenciales:');
  console.log('   admin@tiqui.com       / Admin123!    (Admin original)');
  console.log('   superadmin@tiqui.com  / Admin123!    (Admin 2)');
  console.log('   manager@tiqui.com     / Manager123!  (Manager original)');
  console.log('   manager2@tiqui.com    / Manager123!  (Manager 2)');
  console.log('   tl1@tiqui.com         / Employee123! (Team Leader — Lucía)');
  console.log('   tl2@tiqui.com         / Employee123! (Team Leader — Marcos)');
  console.log('   employee@tiqui.com    / Employee123! (Employee original)');
  console.log('   emp1@tiqui.com        / Employee123! (Employee — Sofía)');
  console.log('   emp2@tiqui.com        / Employee123! (Employee — Diego)');
  console.log('   emp3@tiqui.com        / Employee123! (Employee — Paula)');
}

main().catch(err => { console.error('💥', err); process.exit(1); });
