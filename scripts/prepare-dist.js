const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'client', 'dist');
const destDir = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(srcDir)) {
  console.error('[refundguard] Expected client/dist to exist after build.');
  process.exit(1);
}

if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

fs.mkdirSync(destDir, { recursive: true });
fs.cpSync(srcDir, destDir, { recursive: true });

console.log('[refundguard] Copied client/dist → dist for deployment.');

