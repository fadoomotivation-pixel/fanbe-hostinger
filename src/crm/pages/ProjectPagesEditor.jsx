
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { projectsData } from '@/data/projectsData';
import { getProjectContent } from '@/lib/contentStorage';
import EditContentPanel from '@/crm/components/EditContentPanel';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { triggerContentUpdate, EVENTS } from '@/lib/contentSyncService';

const ProjectPagesEditor = () => {
  const { toast } = useToast();
  const [selectedSlug, setSelectedSlug] = useState('');
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSlug) {
      setLoading(true);
      const staticData = projectsData.find(p => p.slug === selectedSlug);
      const dynamicData = getProjectContent(selectedSlug);
      
      // Merge: dynamic overrides static
      setCurrentProject(dynamicData ? { ...staticData, ...dynamicData } : staticData);
      setLoading(false);
    } else {
      setCurrentProject(null);
    }
  }, [selectedSlug]);

  const handleProjectSelect = (slug) => {
    setSelectedSlug(slug);
  };

  const refreshData = () => {
    // Re-trigger load
    const staticData = projectsData.find(p => p.slug === selectedSlug);
    const dynamicData = getProjectContent(selectedSlug);
    setCurrentProject(dynamicData ? { ...staticData, ...dynamicData } : staticData);
    
    // Toast already handled inside EditContentPanel, but we can add specific one here if needed
    // triggerContentUpdate is also called inside EditContentPanel
  };

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Project Pages Editor</h1>
          <p className="text-gray-500">Manage content for individual project pages</p>
        </div>
        <Link to="/crm/admin/cms">
           <Button variant="outline"><ArrowLeft className="mr-2" size={16} /> Back to Dashboard</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="max-w-md space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Project to Edit</label>
            <Select value={selectedSlug} onValueChange={handleProjectSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projectsData.map(p => (
                  <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="text-center py-12"><Loader2 className="animate-spin h-8 w-8 mx-auto text-blue-600" /></div>}

      {!loading && currentProject && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EditContentPanel project={currentProject} onSave={refreshData} />
        </div>
      )}

      {!loading && !selectedSlug && (
        <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">Please select a project above to begin editing.</p>
        </div>
      )}
    </div>
  );
};

export default ProjectPagesEditor;
