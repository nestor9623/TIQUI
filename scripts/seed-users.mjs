/**
 * seed-users.mjs
 * Crea los 3 usuarios de desarrollo en Supabase Auth + profiles.
 *
 * REQUISITOS PREVIOS:
 *   1. Ve a Supabase Dashboard → Authentication → Settings
 *      y desactiva "Enable email confirmations" (para desarrollo).
 *   2. Obtén la SERVICE ROLE KEY en Settings → API → Project API keys.
 *      ⚠️  NUNCA expongas esta clave en el frontend.
 *
 * USO:
 *   SERVICE_ROLE_KEY=<tu-service-role-key> node scripts/seed-users.mjs
 *
 * O bien crea un archivo .env.seed con:
 *   SERVICE_ROLE_KEY=eyJ...
 * y ejecuta:
 *   node -e "require('dotenv').config({path:'.env.seed'})" scripts/seed-users.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tlccknpjfcxelncrdieh.supabase.co';
const SERVICE_ROLE_KEY = process.env['SERVICE_ROLE_KEY'];

if (!SERVICE_ROLE_KEY) {
  console.error('❌  Falta la variable SERVICE_ROLE_KEY.');
  console.error('   Ejecútalo así:');
  console.error('   SERVICE_ROLE_KEY=<tu-key> node scripts/seed-users.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USERS = [
  {
    email: 'admin@tiqui.com',
    password: 'Admin123!',
    profile: {
      first_name: 'Admin',
      last_name: 'Tiqui',
      role: 'admin',
      active: true,
      area: 'Dirección',
      address: 'Calle Gran Vía 1, Madrid',
      community: 'madrid',
      weekly_hours_target: 40,
      manager_id: null,
      vacation_dates: [],
      avatar: null,
    },
  },
  {
    email: 'manager@tiqui.com',
    password: 'Manager123!',
    profile: {
      first_name: 'Manager',
      last_name: 'Tiqui',
      role: 'manager',
      active: true,
      area: 'Operaciones',
      address: 'Calle Alcalá 50, Madrid',
      community: 'madrid',
      weekly_hours_target: 40,
      manager_id: null,
      vacation_dates: [],
      avatar: null,
    },
  },
  {
    email: 'employee@tiqui.com',
    password: 'Employee123!',
    profile: {
      first_name: 'Employee',
      last_name: 'Tiqui',
      role: 'employee',
      active: true,
      area: 'Desarrollo',
      address: 'Rúa Nova 3, Santiago de Compostela',
      community: 'galicia',
      weekly_hours_target: 40,
      manager_id: null, // Se actualizará con el ID del manager tras crearlo
      vacation_dates: [],
      avatar: null,
    },
  },
];

async function seedUsers() {
  console.log('🌱  Iniciando seed de usuarios...\n');
  const createdIds = {};

  for (const user of USERS) {
    console.log(`👤  Creando: ${user.email}`);

    // 1. Crear en auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Confirmar directamente, sin email
    });

    if (authError) {
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        console.log(`   ⚠️  Ya existe en Auth, buscando UUID...`);
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email === user.email);
        if (existing) {
          createdIds[user.email] = existing.id;
          console.log(`   ✅  UUID encontrado: ${existing.id}`);
        }
      } else {
        console.error(`   ❌  Error en Auth: ${authError.message}`);
        continue;
      }
    } else {
      createdIds[user.email] = authData.user.id;
      console.log(`   ✅  Auth creado: ${authData.user.id}`);
    }

    const userId = createdIds[user.email];
    if (!userId) continue;

    // 2. Upsert en profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: user.email,
        ...user.profile,
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`   ❌  Error en profiles: ${profileError.message}`);
    } else {
      console.log(`   ✅  Profile creado\n`);
    }
  }

  // 3. Asignar el manager al employee
  const managerId = createdIds['manager@tiqui.com'];
  const employeeId = createdIds['employee@tiqui.com'];

  if (managerId && employeeId) {
    await supabase
      .from('profiles')
      .update({ manager_id: managerId })
      .eq('id', employeeId);
    console.log(`🔗  Employee asignado al manager: ${managerId}\n`);
  }

  console.log('✅  Seed completado.');
  console.log('\n📋  Credenciales de acceso:');
  console.log('   admin@tiqui.com    / Admin123!');
  console.log('   manager@tiqui.com  / Manager123!');
  console.log('   employee@tiqui.com / Employee123!');
}

seedUsers().catch(console.error);
