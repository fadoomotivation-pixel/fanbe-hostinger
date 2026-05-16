import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

const SRC = 'main-website'
const DEST = 'dist'

if (!existsSync(SRC)) {
  console.error(`❌ main-website/ folder not found — nothing to build.`)
  process.exit(1)
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

// Compiled CRM bundle label patches.
//   - "Dashboard" → "Control" in the admin sidebar
//   - "Call CRM" → "My CRM" in the employee bottom-nav (covers all 3 string
//     forms in the bundle: emoji label, plain label, and page header text)
const assetsDir = path.join(DEST, 'assets')
if (existsSync(assetsDir)) {
  for (const file of readdirSync(assetsDir)) {
    if (!file.endsWith('.js')) continue
    const filePath = path.join(assetsDir, file)
    const content = readFileSync(filePath, 'utf8')
    const patched = content
      .replaceAll(
        'label:"Dashboard",path:"/crm/admin/dashboard"',
        'label:"Control",path:"/crm/admin/dashboard"'
      )
      .replaceAll('"📞 Call CRM"', '"📞 My CRM"')
      .replaceAll('"Call CRM"', '"My CRM"')
    if (patched !== content) {
      writeFileSync(filePath, patched, 'utf8')
      console.log(`🔧 Patched labels (Dashboard → Control, Call CRM → My CRM) in ${file}`)
    }
  }
}
