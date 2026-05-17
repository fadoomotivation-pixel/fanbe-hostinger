import FTP from 'basic-ftp'
import { readdirSync, statSync } from 'fs'
import path from 'path'
import { config as dotenv } from 'dotenv'

dotenv({ path: '.env.deploy' })

const { FTP_HOST, FTP_USER, FTP_PASS, FTP_REMOTE = '/public_html' } = process.env

if (!FTP_HOST || !FTP_USER || !FTP_PASS) {
  console.error('❌ Missing FTP credentials in .env.deploy')
  process.exit(1)
}

const LOCAL_DIST = './dist'

async function uploadDir(client, localDir, remoteDir) {
  await client.ensureDir(remoteDir)
  const entries = readdirSync(localDir)
  for (const entry of entries) {
    const localPath = path.join(localDir, entry)
    const remotePath = `${remoteDir}/${entry}`
    if (statSync(localPath).isDirectory()) {
      await uploadDir(client, localPath, remotePath)
    } else {
      await client.uploadFrom(localPath, remotePath)
      console.log(`✓ ${remotePath}`)
    }
  }
}

const client = new FTP.Client()
client.ftp.verbose = false

// Try FTPS (explicit TLS) first — required by Hostinger
async function tryConnect(secure, port) {
  await client.access({
    host: FTP_HOST,
    user: FTP_USER,
    password: FTP_PASS,
    secure,
    port,
    secureOptions: { rejectUnauthorized: false }
  })
}

try {
  let connected = false

  // Attempt 1: FTPS explicit TLS on port 21
  try {
    console.log('🔌 Trying FTPS (explicit TLS) on port 21...')
    await tryConnect('implicit' === 'explicit' ? true : 'control', 21)
    connected = true
  } catch (e1) {
    console.log('⚠️  Attempt 1 failed, trying plain FTP on port 21...')
    // Attempt 2: Plain FTP port 21
    try {
      await tryConnect(false, 21)
      connected = true
    } catch (e2) {
      console.log('⚠️  Attempt 2 failed, trying FTPS on port 990...')
      // Attempt 3: FTPS implicit port 990
      await tryConnect(true, 990)
      connected = true
    }
  }

  if (connected) {
    console.log('🔗 Connected to FTP:', FTP_HOST)
    await uploadDir(client, LOCAL_DIST, FTP_REMOTE)
    console.log('✅ Deploy complete!')
  }
} catch (err) {
  console.error('❌ FTP Error:', err.message)
  console.error('\n💡 Troubleshooting:')
  console.error('   1. Check FTP credentials in .env.deploy')
  console.error('   2. Hostinger FTP user format: u709132965.fanbegroup.com')
  console.error('   3. Try uploading manually via hPanel → Files → File Manager')
  process.exit(1)
} finally {
  client.close()
}
