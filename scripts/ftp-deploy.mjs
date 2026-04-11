import * as ftp from 'basic-ftp';
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';

// ── Load .env.deploy ─────────────────────────────────────────────────────────
if (existsSync('.env.deploy')) {
  const lines = readFileSync('.env.deploy', 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

const FTP_HOST   = process.env.FTP_HOST;
const FTP_USER   = process.env.FTP_USER;
const FTP_PASS   = process.env.FTP_PASS;
const FTP_REMOTE = process.env.FTP_REMOTE || '/public_html';
const LOCAL_DIR  = resolve('dist');

if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
  console.error('\n❌  Missing FTP credentials.');
  console.error('    Create .env.deploy with:');
  console.error('    FTP_HOST=ftp.fanbegroup.com');
  console.error('    FTP_USER=your_ftp_user');
  console.error('    FTP_PASS=your_ftp_pass');
  console.error('    FTP_REMOTE=/public_html  (optional)\n');
  process.exit(1);
}

const MAX_RETRIES = 3;

async function tryDeploy(attempt) {
  const client = new ftp.Client();

  // ✅ Generous timeout — large dist (~3MB) needs time on slow connections
  client.ftp.timeout = 60000; // 60 s per operation
  client.ftp.verbose = false;

  try {
    console.log(`\n🚀  Connecting to ${FTP_HOST}... (attempt ${attempt}/${MAX_RETRIES})`);

    await client.access({
      host:     FTP_HOST,
      user:     FTP_USER,
      password: FTP_PASS,
      secure:   false,
      // ✅ Force PASV — active mode is blocked by most home/office routers
      pasv:     true,
    });

    console.log(`📁  Uploading dist/ → ${FTP_REMOTE}`);
    console.log('    This may take 2-5 minutes for ~3 MB of assets...\n');

    await client.ensureDir(FTP_REMOTE);
    await client.clearWorkingDir();

    // ✅ Track progress
    client.trackProgress(info => {
      if (info.name) process.stdout.write(`    ↑ ${info.name}\r`);
    });

    await client.uploadFromDir(LOCAL_DIR);
    client.trackProgress(); // stop tracking

    console.log('\n✅  Deploy complete! Live at https://fanbegroup.com');
    return true;
  } catch (err) {
    console.error(`\n⚠️   Attempt ${attempt} failed: ${err.message}`);
    return false;
  } finally {
    client.close();
  }
}

async function deploy() {
  for (let i = 1; i <= MAX_RETRIES; i++) {
    const ok = await tryDeploy(i);
    if (ok) process.exit(0);
    if (i < MAX_RETRIES) {
      const wait = i * 5000; // 5s, 10s between retries
      console.log(`    Retrying in ${wait / 1000}s...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  console.error(`\n❌  All ${MAX_RETRIES} attempts failed.`);
  console.error('    Try: use FileZilla to upload dist/ manually, or check your internet/VPN.');
  process.exit(1);
}

deploy();
