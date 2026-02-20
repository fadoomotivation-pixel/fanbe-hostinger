# ProjectDetailPage.jsx - Complete Fix Instructions

## Overview
This document contains ALL changes needed for `src/pages/ProjectDetailPage.jsx` to fix:
1. ✅ Orange → Gold color consistency (6 instances)
2. ✅ Breadcrumb navigation
3. ✅ Map section rendering
4. ✅ Desktop sticky CTA
5. ✅ Map URL from CRM support

---

## STEP 1: Import Changes

### Add ChevronLeft to imports (Line 7)
```javascript
// OLD:
import { 
  Check, MapPin, MessageCircle, TrendingUp, Download,
  Home, Shield, Zap, Droplet, Trees, Car, School, Heart,
  ShoppingBag, Train, ChevronDown, ChevronUp, Phone,
  Building2, Calendar, Award, BadgeCheck, FileCheck, ShieldCheck, Receipt
} from 'lucide-react';

// NEW:
import { 
  Check, MapPin, MessageCircle, TrendingUp, Download, ChevronLeft,
  Home, Shield, Zap, Droplet, Trees, Car, School, Heart,
  ShoppingBag, Train, ChevronDown, ChevronUp, Phone,
  Building2, Calendar, Award, BadgeCheck, FileCheck, ShieldCheck, Receipt
} from 'lucide-react';
```

### Add Link to imports (Line 2)
```javascript
// OLD:
import { useParams, Navigate } from 'react-router-dom';

// NEW:
import { useParams, Navigate, Link } from 'react-router-dom';
```

### Add getProjectMapUrl to imports (Line 12)
```javascript
// OLD:
import { getProjectContent, getPricingTable, getProjectImagesFromDB, getProjectDocs } from '@/lib/contentStorage';

// NEW:
import { getProjectContent, getPricingTable, getProjectImagesFromDB, getProjectDocs, getProjectMapUrl } from '@/lib/contentStorage';
```

---

## STEP 2: Add mapUrl State

### Add new state variable (Line 26)
```javascript
// AFTER this line:
const [docs, setDocs] = useState({ brochure: null, map: null });

// ADD:
const [mapUrl, setMapUrl] = useState(null);
```

---

## STEP 3: Update loadData Function

### Add map URL loading (Line 33-44)
```javascript
// OLD:
const loadData = async () => {
  const staticProject = projectsData.find(p => p.slug === slug);
  if (!staticProject) {
    setLoading(false);
    return;
  }

  const dynamicContent = getProjectContent(slug);
  const dynamicPricing = getPricingTable(slug);
  const projectDocs = await getProjectDocs(slug);

  const dbImages = await getProjectImagesFromDB();
  const heroImage = dbImages[slug] || dynamicContent?.heroImage || staticProject.heroImage;

  const mergedProject = { ...staticProject, ...(dynamicContent || {}), heroImage };
  const finalPricing = (dynamicPricing && dynamicPricing.length > 0) ? dynamicPricing : staticProject.pricing;

  setProject(mergedProject);
  setPricing(finalPricing);
  setDocs(projectDocs);
  setLoading(false);
};

// NEW:
const loadData = async () => {
  const staticProject = projectsData.find(p => p.slug === slug);
  if (!staticProject) {
    setLoading(false);
    return;
  }

  const dynamicContent = getProjectContent(slug);
  const dynamicPricing = getPricingTable(slug);
  const projectDocs = await getProjectDocs(slug);
  const dynamicMapUrl = getProjectMapUrl(slug); // NEW

  const dbImages = await getProjectImagesFromDB();
  const heroImage = dbImages[slug] || dynamicContent?.heroImage || staticProject.heroImage;

  const mergedProject = { ...staticProject, ...(dynamicContent || {}), heroImage };
  const finalPricing = (dynamicPricing && dynamicPricing.length > 0) ? dynamicPricing : staticProject.pricing;
  const finalMapUrl = dynamicMapUrl || staticProject.mapLocation?.embedUrl || null; // NEW

  setProject(mergedProject);
  setPricing(finalPricing);
  setDocs(projectDocs);
  setMapUrl(finalMapUrl); // NEW
  setLoading(false);
};
```

---

## STEP 4: Add Map Sync Listener

### Add unsubscribeMap (Line 80)
```javascript
// AFTER unsubscribeDocs listener, ADD:

const unsubscribeMap = subscribeToContentUpdates(EVENTS.PROJECT_MAP_UPDATED, (data) => {
  if (!data.data.slug || data.data.slug === slug) {
    loadData();
    toast({ title: "Updated", description: "Project map updated!" });
  }
});

// THEN in return cleanup:
return () => {
  unsubscribeImage();
  unsubscribeContent();
  unsubscribeDocs();
  unsubscribeMap(); // ADD THIS
};
```

---

## STEP 5: Add Breadcrumb Navigation

### Insert AFTER </Helmet> tag (Line 177)
```jsx
</Helmet>

{/* Breadcrumb Navigation - NEW */}
<div className="bg-white border-b border-gray-200">
  <div className="container mx-auto px-4 py-4">
    <Link to="/projects" className="inline-flex items-center text-[#0F3A5F] hover:text-[#D4AF37] transition-colors font-medium">
      <ChevronLeft size={20} className="mr-1" />
      All Projects
    </Link>
  </div>
</div>

{/* Hero Section */}
```

---

## STEP 6: Fix Orange Colors → Gold

### Fix 1: Location Markers Border (Line 395)
```jsx
// OLD:
className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border-b-4 border-orange-500 text-center"

// NEW:
className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border-b-4 border-[#D4AF37] text-center"
```

### Fix 2: Location Markers Distance Text (Line 399)
```jsx
// OLD:
<p className="text-orange-500 font-black text-lg mb-3">{marker.distance}</p>

// NEW:
<p className="text-[#D4AF37] font-black text-lg mb-3">{marker.distance}</p>
```

### Fix 3: Premium Amenities Background (Line 453)
```jsx
// OLD:
className="bg-gradient-to-br from-orange-50 to-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border-l-4 border-orange-500 group"

// NEW:
className="bg-gradient-to-br from-[#FBF8EF] to-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border-l-4 border-[#D4AF37] group"
```

### Fix 4: Premium Amenities Border (Line 453 - same line)
Already fixed in Fix 3 above.

### Fix 5: Premium Amenities Category Label (Line 457)
```jsx
// OLD:
<span className="text-xs font-bold text-orange-500 uppercase tracking-wider">{amenity.category}</span>

// NEW:
<span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">{amenity.category}</span>
```

### Fix 6: Investment Insight Section Background (Line 499)
```jsx
// OLD:
<section className="py-20 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white relative overflow-hidden">

// NEW:
<section className="py-20 bg-gradient-to-r from-[#0F3A5F] via-[#1a5a8f] to-[#0F3A5F] text-white relative overflow-hidden">
```

---

## STEP 7: Add Map Section

### Insert AFTER Location Markers Section, BEFORE Basic Infrastructure (Line 410)
```jsx
      </section>
      )}

      {/* Map Section - NEW */}
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
                  title={`${project.title} Location Map`}
                />
              </div>
              <p className="text-center text-gray-600 mt-6 text-lg">
                <MapPin className="inline mr-2 text-[#D4AF37]" size={20} />
                {project.location}
              </p>
            </motion.div>
          </div>
        </section>
      )}

      {/* Basic Infrastructure Section */}
```

---

## STEP 8: Fix Desktop Sticky CTA

### Change Mobile-Only to All Screens (Line 865)
```jsx
// OLD:
<div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t-2 border-[#D4AF37] md:hidden z-50 flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.15)]">

// NEW:
<div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t-2 border-[#D4AF37] z-50 flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.15)]">
```

---

## VERIFICATION CHECKLIST

After applying all changes:

- [ ] Import statements include `ChevronLeft`, `Link`, and `getProjectMapUrl`
- [ ] `mapUrl` state variable added
- [ ] `loadData` function loads and sets map URL
- [ ] Map sync event listener added
- [ ] Breadcrumb shows "← All Projects" link
- [ ] NO instances of `orange-500` or `orange-600` remain
- [ ] ALL changed to `#D4AF37` or `#0F3A5F`
- [ ] Map section renders when `mapUrl` exists
- [ ] Sticky CTA works on desktop (no `md:hidden`)

---

## FINAL RESULT

### Fixed:
1. ✅ Orange → Gold (6 color changes)
2. ✅ Breadcrumb navigation added
3. ✅ Map section renders from CRM or static data
4. ✅ Desktop sticky CTA visible
5. ✅ Real-time map updates from CRM

### User Experience:
- Investors can navigate back to projects listing easily
- Map proves project location legitimacy
- Brand colors consistent throughout (Navy + Gold)
- CTA always visible while scrolling
- Admin can update map via CRM and see changes live

---

*Apply these changes line-by-line to `src/pages/ProjectDetailPage.jsx`*
*Or use find-replace for color values*
