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
