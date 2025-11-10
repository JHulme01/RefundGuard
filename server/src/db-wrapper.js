// Wrapper to use mock DB in serverless, real DB locally
// Always use mock DB for now to avoid SQLite issues in serverless
import * as mockDb from './db-mock.js';

console.log('[db-wrapper] Using mock database (in-memory)');

export const {
  upsertCreator,
  saveTokens,
  getTokens,
  savePolicy,
  getPolicy,
  logRefund,
  listRefundLogs
} = mockDb;

