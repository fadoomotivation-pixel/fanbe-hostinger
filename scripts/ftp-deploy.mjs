import * as ftp from 'basic-ftp';
import { readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { config } from 'node:process';

// ── Load .env manually (no dotenv dep needed) ──────────────────────────────
import { readFileSync, existsSync } from 'node:fs';
if (existsSync('.env.deploy')) {
  const lines = readFileSync('.env.deploy', 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

const FTP_HOST     = process.env.FTP_HOST;
const FTP_USER     = process.env.FTP_USER;
const FTP_PASS     = process.env.FTP_PASS;
const FTP_REMOTE   = process.env.FTP_REMOTE || '/public_html';
const LOCAL_DIR    = resolve('dist');

if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
  console.error('\n❌  Missing FTP credentials.');
  console.error('    Create a .env.deploy file with:');
  console.error('    FTP_HOST=ftp.yourdomain.com');
  console.error('    FTP_USER=your_ftp_username');
  console.error('    FTP_PASS=your_ftp_password');
  console.error('    FTP_REMOTE=/public_html   (optional, default is /public_html)\n');
  process.exit(1);
}

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    console.log(`\n🚀  Connecting to ${FTP_HOST}...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      secure: false,
    });

    console.log(`📁  Uploading dist/ → ${FTP_REMOTE}`);
    console.log('    This may take 1-3 minutes...\n');

    await client.ensureDir(FTP_REMOTE);
    await client.clearWorkingDir();
    await client.uploadFromDir(LOCAL_DIR);

    console.log('\n✅  Deploy complete! Live at https://fanbegroup.com');
  } catch (err) {
    console.error('\n❌  FTP deploy failed:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
