import postgres from "postgres"
import { config } from "dotenv"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, "..", ".env.local"), quiet: true })

// Parse password safely from DATABASE_URL (avoids URL-bracket parsing issues)
const rawUrl = process.env.DATABASE_URL ?? ""
const match = rawUrl.match(/postgresql:\/\/([^:]+):(.+)@([^/:]+):(\d+)\/(.+)/)
if (!match) { console.error("❌ DATABASE_URL konnte nicht geparst werden:", rawUrl); process.exit(1) }
// Strip surrounding [ ] — Supabase template syntax, not part of the password
const rawPassword = match[2]
const password = rawPassword.startsWith("[") && rawPassword.endsWith("]")
  ? rawPassword.slice(1, -1)
  : rawPassword

const configs = [
  // Old PgBouncer format (port 6543 on direct host)
  { label: "PgBouncer 6543 (direct host)",    host: "db.pktiznslnkgctbuaugqw.supabase.co",   port: 6543, username: "postgres" },
  // New Supavisor (different regions)
  { label: "Supavisor eu-central-1 :6543",    host: "aws-0-eu-central-1.pooler.supabase.com", port: 6543, username: "postgres.pktiznslnkgctbuaugqw" },
  { label: "Supavisor eu-west-2 :6543",       host: "aws-0-eu-west-2.pooler.supabase.com",    port: 6543, username: "postgres.pktiznslnkgctbuaugqw" },
  // Direct connection
  { label: "Direct IPv6 :5432",               host: "db.pktiznslnkgctbuaugqw.supabase.co",   port: 5432, username: "postgres" },
]

for (const cfg of configs) {
  console.log(`\nTeste: ${cfg.label} ...`)
  const sql = postgres({
    host: cfg.host,
    port: cfg.port,
    database: "postgres",
    username: cfg.username,
    password,
    ssl: "require",
    max: 1,
    connect_timeout: 8,
  })
  try {
    const r = await sql`SELECT current_user`
    console.log(`✅ Erfolgreich verbunden als: ${r[0].current_user}`)
    await sql.end()
    process.exit(0)
  } catch (e) {
    console.log(`❌ ${e.message}`)
    await sql.end()
  }
}

console.log("\n❌ Keine Verbindung möglich. Bitte Passwort im Supabase Dashboard prüfen.")
process.exit(1)
