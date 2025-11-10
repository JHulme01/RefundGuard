// Wrapper to use mock DB in serverless, real DB locally
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

let dbModule;
if (isServerless) {
  dbModule = await import('./db-mock.js');
} else {
  try {
    dbModule = await import('./db.js');
  } catch (error) {
    console.warn('SQLite not available, falling back to mock DB:', error.message);
    dbModule = await import('./db-mock.js');
  }
}

export const {
  upsertCreator,
  saveTokens,
  getTokens,
  savePolicy,
  getPolicy,
  logRefund,
  listRefundLogs
} = dbModule;

