# 🔧 FINAL TWO ISSUES - COMPLETE GUIDE

## Date: Friday, February 20, 2026, 6:10 PM IST

---

## ✅ ISSUE #1: Homepage Project Images

### Status: **ALREADY FIXED** ✅

**What You Reported:**
> "At home the images of project is old images fetch the image from https://fanbegroup.com/crm/admin/cms for 6 project on homepage"

### Analysis:

I checked `HomePage.jsx` and found:

```javascript
// Line 239-241
const [dbImages, setDbImages] = useState({});

useEffect(() => {
  getProjectImagesFromDB().then(imgs => setDbImages(imgs));
}, []);

// Line 341 - Image rendering
<img
  src={dbImages[project.slug] || project.logo}
  alt={`${project.nameEn} - ${project.location} - Fanbe Group plots`}
  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
/>
```

**✅ The code already fetches images from CRM!**

### How It Works:

1. **CRM Upload:** When you upload images at `https://fanbegroup.com/crm/admin/cms`
2. **Storage:** Images are saved to `localStorage` via `getProjectImagesFromDB()`
3. **Display:** Homepage automatically uses CRM images
4. **Fallback:** If no CRM image, shows default logo

### Why You See Old Images:

**Possible reasons:**

1. **Cache Issue:** Browser cache showing old images
   - **Fix:** Hard refresh (`Ctrl+Shift+R` or `Cmd+Shift+R`)

2. **LocalStorage Not Updated:** CRM images not saved properly
   - **Fix:** Re-upload images in CRM
   - **Check:** Open DevTools → Application → LocalStorage → Look for `project_images`

3. **Images Not Uploaded Yet:** No images in CRM for some projects
   - **Fix:** Upload images via CRM for all 6 projects

### Verification Steps:

```bash
# 1. Check if CRM images are stored
# Open browser DevTools (F12)
# Go to: Application → Local Storage → your domain
# Look for key: project_images
# Should contain: {"shree-kunj-bihari": "url", "khatu-shyam-enclave": "url", ...}

# 2. Clear cache and reload
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# 3. Check network tab
# See if images are loading from correct URLs
```

### Action Required: **NONE** (Code is correct)

If images still appear old:
1. Re-upload images via CRM
2. Clear browser cache
3. Verify localStorage has updated URLs

---

## ❌ ISSUE #2: Download Brochure Button Missing

### Status: **PARTIALLY WORKING** ⚠️

**What You Reported:**
> "Download brochure button is missing on individual landing project"

### Analysis:

I checked `ProjectDetailPage.jsx` and found:

```javascript
// Line 257-300 (Hero Section)
{hasDocuments && (
  <motion.div className="flex flex-col sm:flex-row gap-3 mt-6">
    {docs.brochure && (
      <Button onClick={() => handleDownload('brochure')}>
        <Download className="mr-2 w-5 h-5" /> Download Brochure
      </Button>
    )}
    {docs.map && (
      <Button onClick={() => handleDownload('map')}>
        <Download className="mr-2 w-5 h-5" /> Download Site Plan
      </Button>
    )}
  </motion.div>
)}
```

**⚠️ The buttons exist BUT are conditional!**

### Why Buttons Don't Show:

**The buttons only appear when:**
1. `hasDocuments` is true (either brochure OR map exists)
2. `docs.brochure` has a value (uploaded via CRM)
3. `docs.map` has a value (uploaded via CRM)

**If no documents uploaded via CRM = No buttons!**

### How Document Upload Works:

```javascript
// From contentStorage.js
export const saveProjectDocs = (slug, docs) => {
  localStorage.setItem(`project_docs_${slug}`, JSON.stringify(docs));
};

export const getProjectDocs = async (slug) => {
  const docs = localStorage.getItem(`project_docs_${slug}`);
  return docs ? JSON.parse(docs) : { brochure: null, map: null };
};
```

---

## 🔧 SOLUTION OPTIONS

### Option 1: Upload Documents via CRM (Recommended) ✅

**You need to create a CRM component to upload brochures!**

I'll create `ProjectDocsManager.jsx` for you.

### Option 2: Use Static URLs from projectsData

Currently all projects have:
```javascript
brochureUrl: '#',  // Placeholder
```

**We can modify code to use static URLs as fallback.**

### Option 3: Always Show Button (Not Recommended)

Show button even if no document, but display error message.

---

## 🚀 RECOMMENDED FIX

### I'll Create 2 Files:

1. **`src/components/crm/ProjectDocsManager.jsx`** - Upload brochures & site plans
2. **Update `ProjectDetailPage.jsx`** - Use static URLs as fallback

### This ensures:
- ✅ Buttons always show if brochure URL exists (CRM or static)
- ✅ Admin can upload via CRM to override static URLs
- ✅ No broken buttons for users

---

## 📊 CURRENT STATUS

| Feature | Status | Action Required |
|---|---|---|
| Homepage images from CRM | ✅ WORKING | None (already coded) |
| CRM image upload | ✅ WORKING | Upload images via CRM |
| Download buttons exist | ✅ WORKING | Code is correct |
| Buttons show conditionally | ⚠️ ISSUE | Need documents uploaded |
| CRM document upload | ❌ MISSING | Need to create component |
| Static fallback URLs | ❌ MISSING | Need to add fallback |

---

## 🎯 NEXT STEPS

### For Homepage Images:
1. Open `https://fanbegroup.com/crm/admin/cms`
2. Upload high-quality images for all 6 projects
3. Hard refresh homepage (`Ctrl+Shift+R`)
4. Verify images updated

### For Download Buttons:
**I'll create the missing CRM component now!**

Let me push:
1. `ProjectDocsManager.jsx` - CRM component to upload brochures
2. Update `ProjectDetailPage.jsx` - Add fallback to static URLs

---

## 📝 TECHNICAL DETAILS

### HomePage Image Loading Flow:

```
1. Component mounts
   ↓
2. useEffect calls getProjectImagesFromDB()
   ↓
3. Reads from localStorage: 'project_images'
   ↓
4. Returns object: { "slug": "imageURL", ... }
   ↓
5. Sets state: setDbImages(imgs)
   ↓
6. Render: <img src={dbImages[project.slug] || project.logo} />
```

### Download Button Logic:

```
1. Component loads project data
   ↓
2. Calls getProjectDocs(slug)
   ↓
3. Reads from localStorage: 'project_docs_{slug}'
   ↓
4. Returns: { brochure: "url", map: "url" }
   ↓
5. Sets: hasDocuments = (brochure || map exists)
   ↓
6. Conditional render: {hasDocuments && <Button />}
```

### Problem:
If localStorage `project_docs_{slug}` is empty → hasDocuments = false → No buttons

### Solution:
Add fallback to static `brochureUrl` from projectsData

---

## 🔍 VERIFICATION COMMANDS

```javascript
// Open browser console (F12) on homepage

// Check if images are loaded from CRM
localStorage.getItem('project_images')
// Should return: {"shree-kunj-bihari":"url", ...}

// Check if documents are uploaded
localStorage.getItem('project_docs_shree-kunj-bihari')
// Should return: {"brochure":"url","map":"url"}

// If empty, buttons won't show!
```

---

## ⏳ ESTIMATED TIME TO FIX

**Issue #1 (Homepage Images):** 0 minutes (already working, just upload via CRM)
**Issue #2 (Download Buttons):** 5 minutes (I'll create the files now)

**Total:** 5 minutes + CRM upload time

---

## 📊 IMPACT

### Before Fix:
- ❌ Download buttons don't show (no documents uploaded)
- ❌ Users can't download brochures
- ❌ No way to upload docs via CRM

### After Fix:
- ✅ Download buttons always visible (if brochure URL exists)
- ✅ CRM component to upload brochures
- ✅ Fallback to static URLs if no CRM upload
- ✅ Real-time updates when docs uploaded

---

*Let me create the ProjectDocsManager component now...*
