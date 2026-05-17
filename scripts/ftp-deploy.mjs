import * as ftp from 'basic-ftp';
import { resolve, join } from 'node:path';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';

// ── Load .env.deploy manually ──────────────────────────────────────────────
if (existsSync('.env.deploy')) {
  const lines = readFileSync('.env.deploy', 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  }
}

const FTP_HOST   = process.env.FTP_HOST   || 'ftp.fanbegroup.com';
const FTP_USER   = process.env.FTP_USER   || 'u709132965';
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
    console.log(`\n🔌  Connecting to ${FTP_HOST}:21 FTPS (attempt ${attempt}/${MAX_RETRIES})...`);
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      port: 21,
      secure: 'implicit',   // FTPS implicit (Hostinger supports this)
      secureOptions: { rejectUnauthorized: false },
      timeout: 60000,
    });
    client.ftp.socket.setKeepAlive(true, 10000);
    client.ftp.socket.setTimeout(120000);
    console.log('✅  Connected!');
  } catch (err) {
    // fallback: try explicit TLS on port 21
    if (attempt === 1) {
      try {
        console.warn(`⚠️   Implicit FTPS failed, trying explicit TLS...`);
        await client.access({
          host: FTP_HOST,
          user: FTP_USER,
          password: FTP_PASS,
          port: 21,
          secure: true,
          secureOptions: { rejectUnauthorized: false },
          timeout: 60000,
        });
        client.ftp.socket.setKeepAlive(true, 10000);
        client.ftp.socket.setTimeout(120000);
        console.log('✅  Connected via explicit TLS!');
        return;
      } catch (e2) {
        console.warn(`⚠️   Explicit TLS also failed (${e2.message}), trying plain FTP...`);
      }
    }
    // fallback: plain FTP
    if (attempt < MAX_RETRIES) {
      try {
        await client.access({
          host: FTP_HOST,
          user: FTP_USER,
          password: FTP_PASS,
          port: 21,
          secure: false,
          timeout: 60000,
        });
        client.ftp.socket.setKeepAlive(true, 10000);
        console.log('✅  Connected via plain FTP!');
        return;
      } catch (e3) {
        console.warn(`⚠️   Plain FTP failed (${e3.message}), retrying in 3s...`);
        await new Promise(r => setTimeout(r, 3000));
        return connectWithRetry(client, attempt + 1);
      }
    }
    throw err;
  }
}

// Recursively upload local dir to remote, overwriting files
async function uploadDir(client, localDir, remoteDir) {
  await client.ensureDir(remoteDir);
  const entries = readdirSync(localDir);
  let count = 0;
  for (const entry of entries) {
    const localPath  = join(localDir, entry);
    const remotePath = `${remoteDir}/${entry}`;
    const stat = statSync(localPath);
    if (stat.isDirectory()) {
      count += await uploadDir(client, localPath, remotePath);
    } else {
      process.stdout.write(`   ↑ ${entry}\n`);
      await client.uploadFrom(localPath, remotePath);
      count++;
    }
  }
  return count;
}

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await connectWithRetry(client);

    console.log(`\n📁  Uploading dist/ → ${FTP_REMOTE}`);
    console.log('    Overwriting files...');
    console.log('    This may take 2-5 minutes...\n');

    const count = await uploadDir(client, LOCAL_DIR, FTP_REMOTE);

    console.log(`\n✅  Deploy complete! ${count} files uploaded.`);
    console.log('🌐  Live at https://fanbegroup.com\n');
  } catch (err) {
    console.error('\n❌  FTP deploy failed:', err.message);
    console.error('\n📄  Manual fallback — use FileZilla:');
    console.error(`    Host: ${FTP_HOST}  User: ${FTP_USER}  Port: 21  Remote: ${FTP_REMOTE}\n`);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
