import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, readFileSync, writeFileSync } from 'fs'
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

// Patch sidebar nav labels in the compiled admin CRM bundle
const assetsDir = path.join(DEST, 'assets')
if (existsSync(assetsDir)) {
  for (const file of readdirSync(assetsDir)) {
    if (!file.endsWith('.js')) continue
    const filePath = path.join(assetsDir, file)
    let content = readFileSync(filePath, 'utf8')
    const patched = content.replaceAll(
      'label:"Dashboard",path:"/crm/admin/dashboard"',
      'label:"Control",path:"/crm/admin/dashboard"'
    )
    if (patched !== content) {
      writeFileSync(filePath, patched, 'utf8')
      console.log(`🔧 Patched sidebar label: Dashboard → Control in ${file}`)
    }
  }
}
