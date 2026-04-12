import * as ftp from 'basic-ftp';
import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

// ── Load .env.deploy manually ──────────────────────────────────────────────
if (existsSync('.env.deploy')) {
  const lines = readFileSync('.env.deploy', 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

const FTP_HOST   = process.env.FTP_HOST   || '145.79.213.160';
const FTP_USER   = process.env.FTP_USER   || 'u891384752.fanbegroup.com';
const FTP_PASS   = process.env.FTP_PASS;
const FTP_REMOTE = process.env.FTP_REMOTE || '/public_html';
const LOCAL_DIR  = resolve('dist');

if (!FTP_PASS) {
  console.error('\n❌  Missing FTP_PASS in .env.deploy file.');
  console.error('    Add: FTP_PASS=your_ftp_password\n');
  process.exit(1);
}

const MAX_RETRIES = 3;

async function connectWithRetry(client, attempt = 1) {
  try {
    console.log(`\n🔌  Connecting to ${FTP_HOST} (attempt ${attempt}/${MAX_RETRIES})...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      port: 21,
      secure: false,
      timeout: 60000,
    });

    // Hostinger keepAlive — prevents ECONNRESET on large file uploads
    client.ftp.socket.setKeepAlive(true, 10000);
    client.ftp.socket.setTimeout(120000);

    // Force passive mode (Hostinger requires this)
    client.ftp.passive = true;

    console.log('✅  Connected!');
  } catch (err) {
    if (attempt < MAX_RETRIES) {
      console.warn(`⚠️   Connection failed (${err.message}), retrying in 3s...`);
      await new Promise(r => setTimeout(r, 3000));
      return connectWithRetry(client, attempt + 1);
    }
    throw err;
  }
}

async function uploadWithRetry(client, attempt = 1) {
  try {
    console.log(`\n📁  Uploading dist/ → ${FTP_REMOTE}`);
    console.log('    This may take 2-5 minutes for large chunks...\n');
    await client.ensureDir(FTP_REMOTE);
    await client.clearWorkingDir();
    await client.uploadFromDir(LOCAL_DIR);
  } catch (err) {
    if (attempt < MAX_RETRIES && err.message.includes('ECONNRESET')) {
      console.warn(`\n⚠️   Upload dropped (ECONNRESET), reconnecting and retrying (${attempt}/${MAX_RETRIES})...`);
      await new Promise(r => setTimeout(r, 5000));
      await connectWithRetry(client, 1);
      return uploadWithRetry(client, attempt + 1);
    }
    throw err;
  }
}

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await connectWithRetry(client);
    await uploadWithRetry(client);
    console.log('\n✅  Deploy complete! Live at https://fanbegroup.com\n');
  } catch (err) {
    console.error('\n❌  FTP deploy failed:', err.message);
    console.error('\n💡  If still failing, open FileZilla and upload dist/ manually:');
    console.error(`    Host: ${FTP_HOST}  User: ${FTP_USER}  Port: 21  Remote: ${FTP_REMOTE}\n`);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
