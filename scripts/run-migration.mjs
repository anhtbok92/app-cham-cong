import { readFileSync } from "node:fs";
import pg from "pg";

const { Client } = pg;

// Load .env manually
const env = {};
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const password = env.DATABASEPASSWORD;
const sql = readFileSync(new URL("../supabase/migrations/001_initial_schema.sql", import.meta.url), "utf8");

// Candidate connection targets (pooler regions + direct)
const candidates = [
  { name: "Session pooler (aws-0-ap-southeast-1)", host: "aws-0-ap-southeast-1.pooler.supabase.com", port: 5432, user: `postgres.${ref}` },
  { name: "Session pooler (aws-0-us-east-1)", host: "aws-0-us-east-1.pooler.supabase.com", port: 5432, user: `postgres.${ref}` },
  { name: "Session pooler (aws-0-us-west-1)", host: "aws-0-us-west-1.pooler.supabase.com", port: 5432, user: `postgres.${ref}` },
  { name: "Session pooler (aws-0-ap-southeast-2)", host: "aws-0-ap-southeast-2.pooler.supabase.com", port: 5432, user: `postgres.${ref}` },
  { name: "Session pooler (aws-0-eu-central-1)", host: "aws-0-eu-central-1.pooler.supabase.com", port: 5432, user: `postgres.${ref}` },
  { name: "Direct", host: `db.${ref}.supabase.co`, port: 5432, user: "postgres" },
];

async function tryConnect(c) {
  const client = new Client({
    host: c.host,
    port: c.port,
    user: c.user,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  return client;
}

let client = null;
for (const c of candidates) {
  try {
    process.stdout.write(`Trying ${c.name} (${c.host})... `);
    client = await tryConnect(c);
    console.log("CONNECTED");
    break;
  } catch (e) {
    console.log("failed:", e.message);
    client = null;
  }
}

if (!client) {
  console.error("\nKhong ket noi duoc toi database qua bat ky endpoint nao.");
  process.exit(1);
}

try {
  console.log("\nRunning migration...");
  await client.query(sql);
  console.log("Migration DONE.");

  const { rows } = await client.query(
    "select table_name from information_schema.tables where table_schema='public' order by table_name"
  );
  console.log("\nTables in public schema:");
  rows.forEach((r) => console.log(" -", r.table_name));
} catch (e) {
  console.error("Migration error:", e.message);
  process.exit(1);
} finally {
  await client.end();
}
