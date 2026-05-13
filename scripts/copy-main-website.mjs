import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync } from 'fs'
import path from 'path'

const SRC = 'main-website'
const DEST = 'dist'

if (!existsSync(SRC)) {
  console.log(`⚠️  main-website/ folder not found — skipping copy. CRM-only build.`)
  process.exit(0)
}

function copyRecursive(src, dest) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const s = path.join(src, entry)
    const d = path.join(dest, entry)
    if (statSync(s).isDirectory()) {
      copyRecursive(s, d)
    } else {
      copyFileSync(s, d)
      console.log(`✓ ${d}`)
    }
  }
}

copyRecursive(SRC, DEST)
console.log('✅ Main website files copied into dist/')
