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

try {
  await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASS, secure: false })
  console.log('🔗 Connected to FTP:', FTP_HOST)
  await uploadDir(client, LOCAL_DIST, FTP_REMOTE)
  console.log('✅ Deploy complete!')
} catch (err) {
  console.error('❌ FTP Error:', err.message)
  process.exit(1)
} finally {
  client.close()
}
