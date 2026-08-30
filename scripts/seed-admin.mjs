import { readFileSync } from "node:fs";

const env = {};
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "Admin@123456";

// 1. Create user via Auth Admin API (email confirmed)
const createRes = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Administrator", role: "admin" },
  }),
});

const createBody = await createRes.json();

if (!createRes.ok && !(createBody.msg && createBody.msg.includes("already"))) {
  console.log("Create user status:", createRes.status, JSON.stringify(createBody));
}

// Get user id (either from creation or by listing)
let userId = createBody.id;
if (!userId) {
  const listRes = await fetch(`${url}/auth/v1/admin/users?per_page=200`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const list = await listRes.json();
  const found = (list.users || []).find((u) => u.email === ADMIN_EMAIL);
  userId = found?.id;
}

if (!userId) {
  console.error("Could not resolve admin user id.");
  process.exit(1);
}

console.log("Admin user id:", userId);

// 2. Upsert profile with role=admin via REST (service key bypasses RLS)
const upsertRes = await fetch(`${url}/rest/v1/profiles?on_conflict=id`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: JSON.stringify({
    id: userId,
    email: ADMIN_EMAIL,
    full_name: "Administrator",
    role: "admin",
    is_active: true,
  }),
});

console.log("Profile upsert status:", upsertRes.status);
console.log(await upsertRes.text());

console.log("\n=== TAI KHOAN ADMIN ===");
console.log("Email:   ", ADMIN_EMAIL);
console.log("Password:", ADMIN_PASSWORD);
