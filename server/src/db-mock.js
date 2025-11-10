// Mock database for serverless environments where SQLite doesn't work
// This provides in-memory storage that resets on each deployment

const inMemoryStore = {
  creators: new Map(),
  tokens: new Map(),
  policies: new Map(),
  refundLogs: new Map()
};

export function upsertCreator({ id, whopId, name, email }) {
  inMemoryStore.creators.set(id, { id, whopId, name, email, createdAt: new Date().toISOString() });
}

export function saveTokens({ creatorId, accessToken, refreshToken, expiresAt }) {
  inMemoryStore.tokens.set(creatorId, {
    creatorId,
    accessToken,
    refreshToken,
    expiresAt,
    updatedAt: new Date().toISOString()
  });
}

export function getTokens(creatorId) {
  return inMemoryStore.tokens.get(creatorId) || null;
}

export function savePolicy({ creatorId, policyId, customDays, customCondition }) {
  inMemoryStore.policies.set(creatorId, {
    creatorId,
    policyId,
    customDays,
    customCondition,
    updatedAt: new Date().toISOString()
  });
}

export function getPolicy(creatorId) {
  return inMemoryStore.policies.get(creatorId) || null;
}

export function logRefund(data) {
  inMemoryStore.refundLogs.set(data.id, {
    ...data,
    recordedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

export function listRefundLogs(creatorId) {
  const logs = [];
  for (const [, log] of inMemoryStore.refundLogs) {
    if (log.creatorId === creatorId) {
      logs.push(log);
    }
  }
  return logs.sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
}

