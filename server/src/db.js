import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'refundguard.db');

if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS creators (
    id TEXT PRIMARY KEY,
    whop_id TEXT UNIQUE,
    name TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    creator_id TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(creator_id) REFERENCES creators(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS policies (
    creator_id TEXT PRIMARY KEY,
    policy_id TEXT NOT NULL,
    custom_days INTEGER,
    custom_condition TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(creator_id) REFERENCES creators(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS refund_logs (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    whop_request_id TEXT,
    purchase_id TEXT,
    purchase_date TEXT,
    days_since_purchase INTEGER,
    product_name TEXT,
    member_name TEXT,
    member_email TEXT,
    amount REAL,
    currency TEXT,
    decision TEXT,
    status TEXT,
    raw_payload TEXT,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(creator_id) REFERENCES creators(id)
  );
`);

export function upsertCreator({ id, whopId, name, email }) {
  db.prepare(
    `
    INSERT INTO creators (id, whop_id, name, email)
    VALUES (@id, @whopId, @name, @email)
    ON CONFLICT(id) DO UPDATE SET
      whop_id = excluded.whop_id,
      name = excluded.name,
      email = excluded.email
  `
  ).run({ id, whopId, name, email });
}

export function saveTokens({ creatorId, accessToken, refreshToken, expiresAt }) {
  db.prepare(
    `
    INSERT INTO tokens (creator_id, access_token, refresh_token, expires_at, updated_at)
    VALUES (@creatorId, @accessToken, @refreshToken, @expiresAt, CURRENT_TIMESTAMP)
    ON CONFLICT(creator_id) DO UPDATE SET
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at,
      updated_at = CURRENT_TIMESTAMP
  `
  ).run({ creatorId, accessToken, refreshToken, expiresAt });
}

export function getTokens(creatorId) {
  return db
    .prepare(`SELECT access_token as accessToken, refresh_token as refreshToken, expires_at as expiresAt FROM tokens WHERE creator_id = ?`)
    .get(creatorId);
}

export function savePolicy({ creatorId, policyId, customDays, customCondition }) {
  db.prepare(
    `
    INSERT INTO policies (creator_id, policy_id, custom_days, custom_condition, updated_at)
    VALUES (@creatorId, @policyId, @customDays, @customCondition, CURRENT_TIMESTAMP)
    ON CONFLICT(creator_id) DO UPDATE SET
      policy_id = excluded.policy_id,
      custom_days = excluded.custom_days,
      custom_condition = excluded.custom_condition,
      updated_at = CURRENT_TIMESTAMP
  `
  ).run({ creatorId, policyId, customDays, customCondition });
}

export function getPolicy(creatorId) {
  return db
    .prepare(
      `
      SELECT policy_id as policyId, custom_days as customDays, custom_condition as customCondition, updated_at as updatedAt
      FROM policies
      WHERE creator_id = ?
    `
    )
    .get(creatorId);
}

export function logRefund({
  id,
  creatorId,
  whopRequestId,
  purchaseId,
  purchaseDate,
  daysSincePurchase,
  productName,
  memberName,
  memberEmail,
  amount,
  currency,
  decision,
  status,
  rawPayload
}) {
  db.prepare(
    `
    INSERT INTO refund_logs (
      id, creator_id, whop_request_id, purchase_id, member_name, member_email, amount, currency, decision, status, raw_payload, recorded_at, updated_at
    ) VALUES (
      @id, @creatorId, @whopRequestId, @purchaseId, @purchaseDate, @daysSincePurchase, @productName, @memberName, @memberEmail, @amount, @currency, @decision, @status, @rawPayload, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      decision = excluded.decision,
      purchase_date = excluded.purchase_date,
      days_since_purchase = excluded.days_since_purchase,
      product_name = excluded.product_name,
      raw_payload = excluded.raw_payload,
      updated_at = CURRENT_TIMESTAMP
  `
  ).run({
    id,
    creatorId,
    whopRequestId,
    purchaseId,
    purchaseDate,
    daysSincePurchase,
    productName,
    memberName,
    memberEmail,
    amount,
    currency,
    decision,
    status,
    rawPayload: typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload)
  });
}

export function listRefundLogs(creatorId, limit = 50) {
  return db
    .prepare(
      `
      SELECT id, whop_request_id as whopRequestId, purchase_id as purchaseId, purchase_date as purchaseDate, days_since_purchase as daysSincePurchase,
        product_name as productName,
        member_name as memberName, member_email as memberEmail,
        amount, currency, decision, status, recorded_at as recordedAt, updated_at as updatedAt
      FROM refund_logs
      WHERE creator_id = ?
      ORDER BY recorded_at DESC
      LIMIT ?
    `
    )
    .all(creatorId, limit);
}

export default db;

