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

// Patch 1: sidebar nav labels in the compiled admin CRM bundle
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

// Patch 2: inject navigation interceptor into dist/index.html so that
// clicking "Call CRM" (or any /crm/sales/* link) inside the admin CRM SPA
// triggers a full page reload — this hands control to the Vite-built
// Sales CRM which has smart notes and browser notifications.
const indexPath = path.join(DEST, 'index.html')
if (existsSync(indexPath)) {
  let html = readFileSync(indexPath, 'utf8')
  const interceptScript = `<script>
(function(){
  var _push = history.pushState.bind(history);
  var _replace = history.replaceState.bind(history);
  function intercept(url) {
    if (!url) return false;
    try { var p = new URL(String(url), location.href).pathname; if (p.startsWith('/crm/sales/')) { location.href = p; return true; } } catch(e) {}
    return false;
  }
  history.pushState = function(s,t,url){ if(intercept(url)) return; return _push(s,t,url); };
  history.replaceState = function(s,t,url){ if(intercept(url)) return; return _replace(s,t,url); };
})();
</script>`
  html = html.replace('</head>', interceptScript + '\n</head>')
  writeFileSync(indexPath, html, 'utf8')
  console.log('🔧 Injected /crm/sales/* navigation interceptor into dist/index.html')
}
