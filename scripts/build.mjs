import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
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
