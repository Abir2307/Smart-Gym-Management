import crypto from "crypto";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { seedAttendance, seedNotifications, seedRecords, seedUsers } from "./data/seed.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "FATAL: DATABASE_URL is not set. Please set DATABASE_URL to your PostgreSQL connection string (see .env.example).",
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSLMODE === "require" ? { rejectUnauthorized: false } : false,
});

let initialized = false;

export async function initializeDatabase() {
  if (!pool || initialized) {
    return { ready: false, mode: "memory" };
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS gym_users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS gym_records (
      id TEXT PRIMARY KEY,
      resource_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS gym_attendance (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      member_name TEXT NOT NULL,
      checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checked_in_by TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES gym_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ
    );
  `);

  // Seed only the admin account on first run
  const userCountResult = await pool.query("SELECT COUNT(*)::int AS count FROM gym_users");
  if (userCountResult.rows[0].count === 0) {
    const adminUser = seedUsers[0]; // Only seed the admin user
    const passwordHash = await bcrypt.hash(adminUser.password, 10);
    await pool.query(
      `INSERT INTO gym_users (id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [adminUser.id, adminUser.fullName, adminUser.email, passwordHash, adminUser.role],
    );
  }
  // All other data will be created by users via the app

  initialized = true;
  return { ready: true, mode: "postgres" };
}

export async function query(text, params = []) {
  if (!pool) {
    throw new Error("PostgreSQL is not configured.");
  }

  return pool.query(text, params);
}

export async function getUserByEmail(email) {
  if (!pool) {
    return seedUsers.find((user) => user.email === email) ?? null;
  }

  const result = await query(
    "SELECT id, full_name AS \"fullName\", email, password_hash AS \"passwordHash\", role FROM gym_users WHERE email = $1 LIMIT 1",
    [email],
  );

  return result.rows[0] ?? null;
}

export async function createPasswordResetToken(tokenHash, userId, expiresAt) {
  await query(
    `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
     VALUES ($1, $2, $3)`,
    [tokenHash, userId, expiresAt],
  );
}

export async function consumePasswordResetToken(tokenHash) {
  const result = await query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
     RETURNING user_id`,
    [tokenHash],
  );

  return result.rows[0]?.user_id ?? null;
}

export async function updateUserPassword(userId, passwordHash) {
  await query("UPDATE gym_users SET password_hash = $2 WHERE id = $1", [userId, passwordHash]);
}

export async function listRecords(resourceType) {
  if (!pool) {
    return seedRecords[resourceType].map((record) => ({ id: record.id, payload: record.payload }));
  }

  const result = await query(
    `SELECT id, payload FROM gym_records WHERE resource_type = $1 ORDER BY created_at DESC`,
    [resourceType],
  );

  return result.rows.map((row) => ({ id: row.id, payload: row.payload }));
}

export async function createRecord(resourceType, id, payload) {
  if (!pool) {
    seedRecords[resourceType].unshift({ id, payload });
    return { id, payload };
  }

  await query(
    `INSERT INTO gym_records (id, resource_type, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [id, resourceType, JSON.stringify(payload)],
  );

  return { id, payload };
}

export async function updateRecord(resourceType, id, payload) {
  if (!pool) {
    const resource = seedRecords[resourceType];
    const index = resource.findIndex((record) => record.id === id);
    if (index !== -1) {
      resource[index] = { id, payload };
    }
    return { id, payload };
  }

  await query(
    `UPDATE gym_records
     SET payload = $3::jsonb, updated_at = NOW()
     WHERE id = $1 AND resource_type = $2`,
    [id, resourceType, JSON.stringify(payload)],
  );

  return { id, payload };
}

export async function deleteRecord(resourceType, id) {
  if (!pool) {
    const resource = seedRecords[resourceType];
    const index = resource.findIndex((record) => record.id === id);
    if (index !== -1) {
      resource.splice(index, 1);
    }
    return;
  }

  await query("DELETE FROM gym_records WHERE id = $1 AND resource_type = $2", [id, resourceType]);
}

export function isPostgresEnabled() {
  return true;
}

export async function listAttendanceEntries() {
  if (!pool) {
    return seedAttendance;
  }

  const result = await query(
    `SELECT id, member_id AS "memberId", member_name AS "memberName", checked_in_at AS "checkedInAt", checked_in_by AS "checkedInBy", note
     FROM gym_attendance
     ORDER BY checked_in_at DESC`,
  );

  return result.rows;
}

export async function createAttendanceEntry(entry) {
  if (!pool) {
    seedAttendance.unshift(entry);
    return entry;
  }

  await query(
    `INSERT INTO gym_attendance (id, member_id, member_name, checked_in_at, checked_in_by, note)
     VALUES ($1, $2, $3, NOW(), $4, $5)`,
    [entry.id, entry.memberId, entry.memberName, entry.checkedInBy, entry.note],
  );

  return entry;
}