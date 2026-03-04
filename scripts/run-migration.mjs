/**
 * PROJ-31 Migration Runner
 * Usage: DATABASE_URL="postgresql://..." node scripts/run-migration.mjs
 * Or:    add DATABASE_URL to .env.local and run: node -r dotenv/config scripts/run-migration.mjs
 */

import postgres from "postgres"
import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import { config } from "dotenv"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local (same as Next.js does)
config({ path: join(__dirname, "..", ".env.local"), quiet: true })

// Read DATABASE_URL from env
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL nicht gesetzt.")
  console.error(
    "    Füge DATABASE_URL in .env.local ein oder übergib sie als Env-Variable:"
  )
  console.error(
    '    DATABASE_URL="postgresql://postgres.xxx:PASSWORD@..." node scripts/run-migration.mjs'
  )
  process.exit(1)
}

// Parse connection params to handle passwords with special chars ([ ] ! etc.)
const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):(.+)@([^/:]+):(\d+)\/(.+)/)
if (!urlMatch) {
  console.error("❌ DATABASE_URL konnte nicht geparst werden")
  process.exit(1)
}
const [, , rawPassword, , ,] = urlMatch

// Strip surrounding [ ] — Supabase template syntax, not part of the password
const password = rawPassword.startsWith("[") && rawPassword.endsWith("]")
  ? rawPassword.slice(1, -1)
  : rawPassword

const sql = postgres({
  host: "db.pktiznslnkgctbuaugqw.supabase.co",
  port: 6543,
  database: "postgres",
  username: "postgres",
  password,
  ssl: "require",
  max: 1,
})

const migrationFile = join(__dirname, "..", "supabase", "migrations", "PROJ-31-workgroup-chat.sql")
const migrationSQL = readFileSync(migrationFile, "utf-8")

console.log("🚀  PROJ-31 Workgroup Chat – Migration wird ausgeführt …\n")

try {
  // Execute the full migration as one transaction
  await sql.unsafe(migrationSQL)
  console.log("✅  Migration erfolgreich abgeschlossen!")
  console.log("\nNächste Schritte:")
  console.log("   • Supabase Dashboard → Table Editor → workgroup_messages prüfen")
  console.log("   • Supabase Dashboard → Authentication → Policies prüfen")
  console.log("   • Supabase Dashboard → Database → Replication → workgroup_messages prüfen")
} catch (err) {
  // Some statements may already exist (e.g. re-running migration) — show details
  console.error("❌  Fehler bei der Migration:")
  console.error("   ", err.message)
  if (err.detail) console.error("    Detail:", err.detail)
  process.exit(1)
} finally {
  await sql.end()
}
