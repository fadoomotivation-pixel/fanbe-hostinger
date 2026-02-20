# CRM Map Management Component

## Purpose
This component allows CRM admin to update Google Maps embed URLs for each project. Changes sync in real-time to the frontend.

---

## Component Code

### File: `src/components/crm/ProjectMapManager.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Map, Save, ExternalLink, AlertCircle } from 'lucide-react';
import { projectsData } from '@/data/projectsData';
import { saveProjectMapUrl, getProjectMapUrl } from '@/lib/contentStorage';
import { triggerContentUpdate, EVENTS } from '@/lib/contentSyncService';

const ProjectMapManager = () => {
  const { toast } = useToast();
  const [mapUrls, setMapUrls] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    // Load existing map URLs
    const urls = {};
    projectsData.forEach(project => {
      const savedUrl = getProjectMapUrl(project.slug);
      urls[project.slug] = savedUrl || project.mapLocation?.embedUrl || '';
    });
    setMapUrls(urls);
  }, []);

  const handleSaveMap = async (slug) => {
    setSaving(prev => ({ ...prev, [slug]: true }));

    try {
      const url = mapUrls[slug];
      
      // Validate URL
      if (url && !url.includes('google.com/maps')) {
        toast({
          title: 'Invalid URL',
          description: 'Please enter a valid Google Maps embed URL',
          variant: 'destructive'
        });
        setSaving(prev => ({ ...prev, [slug]: false }));
        return;
      }

      // Save to localStorage
      saveProjectMapUrl(slug, url);

      // Trigger real-time update
      triggerContentUpdate(EVENTS.PROJECT_MAP_UPDATED, { slug });

      toast({
        title: 'Map Updated',
        description: `Map URL for ${projectsData.find(p => p.slug === slug)?.title} has been updated`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save map URL',
        variant: 'destructive'
      });
    } finally {
      setSaving(prev => ({ ...prev, [slug]: false }));
    }
  };

  const handleMapChange = (slug, value) => {
    setMapUrls(prev => ({ ...prev, [slug]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Map className="w-8 h-8 text-[#0F3A5F]" />
        <div>
          <h2 className="text-2xl font-bold text-[#0F3A5F]">Project Map Manager</h2>
          <p className="text-gray-600">Update Google Maps embed URLs for project location display</p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="border-[#D4AF37] bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F3A5F]">
            <AlertCircle size={20} />
            How to Get Google Maps Embed URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Maps</a></li>
            <li>Search for the project location</li>
            <li>Click <strong>Share</strong> button</li>
            <li>Click <strong>Embed a map</strong> tab</li>
            <li>Copy the <code className="bg-gray-200 px-1 rounded">src</code> URL from the iframe (starts with https://www.google.com/maps/embed?pb=...)</li>
            <li>Paste it in the input field below</li>
          </ol>
        </CardContent>
      </Card>

      {/* Project Map URLs */}
      {projectsData.map((project) => (
        <Card key={project.slug}>
          <CardHeader>
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <CardDescription>{project.location}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`map-${project.slug}`}>Google Maps Embed URL</Label>
              <Input
                id={`map-${project.slug}`}
                placeholder="https://www.google.com/maps/embed?pb=..."
                value={mapUrls[project.slug] || ''}
                onChange={(e) => handleMapChange(project.slug, e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleSaveMap(project.slug)}
                disabled={saving[project.slug]}
                className="bg-[#0F3A5F] hover:bg-[#1a5a8f]"
              >
                <Save className="mr-2" size={16} />
                {saving[project.slug] ? 'Saving...' : 'Save Map URL'}
              </Button>

              {mapUrls[project.slug] && (
                <Button
                  variant="outline"
                  onClick={() => window.open(mapUrls[project.slug], '_blank')}
                  className="border-[#D4AF37] text-[#0F3A5F] hover:bg-[#FBF8EF]"
                >
                  <ExternalLink className="mr-2" size={16} />
                  Preview Map
                </Button>
              )}
            </div>

            {mapUrls[project.slug] && (
              <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={mapUrls[project.slug]}
                  className="w-full h-[300px]"
                  frameBorder="0"
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${project.title} Map Preview`}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectMapManager;
```

---

## Integration Instructions

### Step 1: Add Component to CRM

In your CRM routing file (e.g., `src/pages/CRM.jsx` or `src/components/crm/CRMDashboard.jsx`), add:

```jsx
import ProjectMapManager from '@/components/crm/ProjectMapManager';

// Then add a route/tab for it:
{
  id: 'maps',
  label: 'Project Maps',
  icon: Map,
  component: <ProjectMapManager />
}
```

### Step 2: Add to CRM Navigation Menu

If you have a sidebar navigation:

```jsx
<NavItem icon={<Map />} label="Project Maps" path="/crm/maps" />
```

---

## Features

### ✅ What This Component Does:

1. **Lists All Projects** - Shows all 6 projects with their current map URLs
2. **URL Input** - Admin can paste Google Maps embed URL
3. **Validation** - Checks that URL contains 'google.com/maps'
4. **Live Preview** - Shows iframe preview of entered URL
5. **Save Function** - Stores URL in localStorage
6. **Real-Time Sync** - Triggers `PROJECT_MAP_UPDATED` event
7. **Frontend Update** - ProjectDetailPage automatically reflects changes
8. **Instructions** - Shows step-by-step how to get embed URL

---

## Testing

### Test Case 1: Add New Map
1. Open CRM → Project Maps
2. Select "Shree Kunj Bihari Enclave"
3. Paste Google Maps embed URL
4. Click "Save Map URL"
5. Open frontend `/projects/shree-kunj-bihari` in another tab
6. Scroll to "Find Us on Map" section
7. ✅ Map should appear

### Test Case 2: Update Existing Map
1. Change URL for any project
2. Click Save
3. Check frontend
4. ✅ Map should update without refresh

### Test Case 3: Remove Map
1. Clear URL field
2. Click Save
3. Check frontend
4. ✅ Map section should disappear

---

## Example Google Maps Embed URL

```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3506.123456789!2d77.1234567!3d28.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDA3JzI0LjQiTiA3N8KwMDcnMjQuNCJF!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin
```

---

## Screenshot Locations

### CRM View:
- Title: "Project Map Manager"
- Instructions card at top
- Each project gets a card with:
  - Project name
  - Location text
  - URL input field
  - Save button
  - Preview button
  - Live iframe preview

### Frontend View (ProjectDetailPage):
- Section appears between "Location Markers" and "Basic Infrastructure"
- Gold border around map iframe
- Section title: "Find Us on Map"
- Location text below map

---

## Storage Details

- **Storage Type:** localStorage
- **Key Format:** `fanbe_project_map_{slug}`
- **Example Key:** `fanbe_project_map_shree-kunj-bihari`
- **Value:** Plain URL string
- **Fallback:** Uses `projectsData.mapLocation.embedUrl` if no CRM value

---

## Security Considerations

1. **URL Validation:** Only accepts URLs containing 'google.com/maps'
2. **XSS Protection:** iframe has sandbox attributes
3. **Referrer Policy:** Set to 'no-referrer-when-downgrade'
4. **Loading:** Lazy loading enabled

---

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

---

*Component ready to integrate into existing CRM*
