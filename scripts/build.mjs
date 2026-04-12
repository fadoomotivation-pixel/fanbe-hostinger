import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const now = new Date()
const buildTimestamp = now.toISOString()
const buildId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const getCmdOutput = (cmd) => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'unknown'
  }
}

// ✅ FIX: Manually parse .env and inject into process.env BEFORE spawning vite build.
// execSync with an explicit `env` object bypasses Vite's auto .env loading because
// it replaces the child process environment entirely. Without this, VITE_SUPABASE_URL
// and other VITE_* keys never reach the Vite build process and resolve as undefined.
const dotenvPath = resolve('.env')
if (existsSync(dotenvPath)) {
  const lines = readFileSync(dotenvPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key) process.env[key] = val
  }
  console.log(`✅ Loaded .env (${lines.filter(l => l.trim() && !l.trim().startsWith('#')).length} vars)`)
} else {
  console.warn('⚠️  No .env file found — VITE_* variables will be undefined in the bundle!')
}

const versionInfo = {
  buildId,
  buildTimestamp,
  gitCommit: getCmdOutput('git rev-parse --short HEAD'),
  gitBranch: getCmdOutput('git rev-parse --abbrev-ref HEAD'),
}

const publicDir = resolve('public')
mkdirSync(publicDir, { recursive: true })
writeFileSync(resolve(publicDir, 'version.json'), `${JSON.stringify(versionInfo, null, 2)}\n`)

console.log(`🔖 Build ID: ${buildId}`)
execSync('npx vite build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    BUILD_ID: buildId,
    BUILD_TIMESTAMP: buildTimestamp,
    BUILD_COMMIT: versionInfo.gitCommit,
    BUILD_BRANCH: versionInfo.gitBranch,
  },
})
