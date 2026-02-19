# Document Download Fix

## Issue
Documents uploaded to cloud storage not showing on project detail pages.

## Root Cause
`getProjectDocs()` is now async but was being called without `await` in ProjectDetailPage.jsx

## Fix Required

### File: `src/pages/ProjectDetailPage.jsx`

**Line ~43:** Change this:
```javascript
const projectDocs = getProjectDocs(slug);
```

To this:
```javascript
const projectDocs = await getProjectDocs(slug); // Add await!
```

**Lines ~86-99:** Change download handler from:
```javascript
const handleDownload = (docType) => {
  const doc = docs[docType];
  if (!doc) {
    toast({ title: 'Not Available', ... });
    return;
  }
  
  const link = document.createElement('a');
  link.href = doc.data;
  link.download = doc.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast({ title: 'Download Started', ... });
};
```

To this:
```javascript
const handleDownload = (docType) => {
  const doc = docs[docType];
  if (!doc) {
    toast({
      title: 'Not Available',
      description: `${docType === 'brochure' ? 'Brochure' : 'Site Plan'} not uploaded yet.`,
      variant: 'destructive'
    });
    return;
  }
  
  // Open cloud URL in new tab
  window.open(doc.data, '_blank');
  
  toast({
    title: 'Opening Document',
    description: `${docType === 'brochure' ? 'Brochure' : 'Site Plan'} is opening...`,
  });
};
```

## Why This Fixes It

1. **await getProjectDocs()** - Now properly waits for Supabase to fetch documents
2. **window.open()** - Opens cloud URL directly instead of trying to download base64
3. Documents will now display on: `https://fanbegroup.com/projects/shree-kunj-bihari`

## Test After Deploy

1. `git pull origin main`
2. `npm run build`
3. Visit: `https://fanbegroup.com/projects/shree-kunj-bihari`
4. Should see **"Download Brochure"** button
5. Click it - opens PDF in new tab
