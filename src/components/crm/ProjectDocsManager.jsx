import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Upload, ExternalLink, AlertCircle, Download } from 'lucide-react';
import { projectsData } from '@/data/projectsData';
import { saveProjectDocs, getProjectDocs } from '@/lib/contentStorage';
import { triggerContentUpdate, EVENTS } from '@/lib/contentSyncService';

const ProjectDocsManager = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    // Load existing documents
    const loadDocs = async () => {
      const allDocs = {};
      for (const project of projectsData) {
        const docs = await getProjectDocs(project.slug);
        allDocs[project.slug] = docs;
      }
      setDocuments(allDocs);
    };
    loadDocs();
  }, []);

  const handleDocChange = (slug, docType, value) => {
    setDocuments(prev => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        [docType]: { data: value, timestamp: Date.now() }
      }
    }));
  };

  const handleSaveDocs = async (slug) => {
    setSaving(prev => ({ ...prev, [slug]: true }));

    try {
      const docs = documents[slug];
      
      // Validate URLs if provided
      const brochureUrl = docs?.brochure?.data || '';
      const mapUrl = docs?.map?.data || '';

      if (brochureUrl && !brochureUrl.startsWith('http')) {
        toast({
          title: 'Invalid Brochure URL',
          description: 'Please enter a valid URL starting with http:// or https://',
          variant: 'destructive'
        });
        setSaving(prev => ({ ...prev, [slug]: false }));
        return;
      }

      if (mapUrl && !mapUrl.startsWith('http')) {
        toast({
          title: 'Invalid Site Plan URL',
          description: 'Please enter a valid URL starting with http:// or https://',
          variant: 'destructive'
        });
        setSaving(prev => ({ ...prev, [slug]: false }));
        return;
      }

      // Save to localStorage
      saveProjectDocs(slug, docs);

      // Trigger real-time update
      triggerContentUpdate(EVENTS.PROJECT_DOCS_UPDATED, { slug });

      toast({
        title: 'Documents Updated',
        description: `Documents for ${projectsData.find(p => p.slug === slug)?.title} have been updated`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save documents',
        variant: 'destructive'
      });
    } finally {
      setSaving(prev => ({ ...prev, [slug]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-8 h-8 text-[#0F3A5F]" />
        <div>
          <h2 className="text-2xl font-bold text-[#0F3A5F]">Project Documents Manager</h2>
          <p className="text-gray-600">Upload brochures and site plans for download on project pages</p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="border-[#D4AF37] bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F3A5F]">
            <AlertCircle size={20} />
            How to Upload Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-sm mb-2">Option 1: Upload to Google Drive (Recommended)</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 ml-2">
                <li>Upload your brochure PDF to Google Drive</li>
                <li>Right-click → Get link → Change to "Anyone with the link"</li>
                <li>Copy the share link</li>
                <li>Paste it below in the Brochure URL field</li>
              </ol>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-2">Option 2: Direct URL</h4>
              <p className="text-sm text-gray-700 ml-2">
                If you have the PDF hosted somewhere else (Dropbox, your server, etc.), 
                paste the direct download URL below.
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> Make sure the URL is publicly accessible. 
                Users will see "Download Brochure" and "Download Site Plan" buttons on project pages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Documents */}
      {projectsData.map((project) => (
        <Card key={project.slug}>
          <CardHeader>
            <CardTitle className="text-lg">{project.title}</CardTitle>
            <CardDescription>{project.location}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Brochure URL */}
            <div>
              <Label htmlFor={`brochure-${project.slug}`} className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-[#D4AF37]" />
                Brochure URL (PDF)
              </Label>
              <Input
                id={`brochure-${project.slug}`}
                placeholder="https://drive.google.com/file/d/.../view or direct PDF URL"
                value={documents[project.slug]?.brochure?.data || ''}
                onChange={(e) => handleDocChange(project.slug, 'brochure', e.target.value)}
                className="mb-2"
              />
              {documents[project.slug]?.brochure?.data && (
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(documents[project.slug].brochure.timestamp).toLocaleString()}
                </p>
              )}
            </div>

            {/* Site Plan URL */}
            <div>
              <Label htmlFor={`map-${project.slug}`} className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-[#D4AF37]" />
                Site Plan URL (PDF)
              </Label>
              <Input
                id={`map-${project.slug}`}
                placeholder="https://drive.google.com/file/d/.../view or direct PDF URL"
                value={documents[project.slug]?.map?.data || ''}
                onChange={(e) => handleDocChange(project.slug, 'map', e.target.value)}
                className="mb-2"
              />
              {documents[project.slug]?.map?.data && (
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(documents[project.slug].map.timestamp).toLocaleString()}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleSaveDocs(project.slug)}
                disabled={saving[project.slug]}
                className="bg-[#0F3A5F] hover:bg-[#1a5a8f]"
              >
                <Upload className="mr-2" size={16} />
                {saving[project.slug] ? 'Saving...' : 'Save Documents'}
              </Button>

              {documents[project.slug]?.brochure?.data && (
                <Button
                  variant="outline"
                  onClick={() => window.open(documents[project.slug].brochure.data, '_blank')}
                  className="border-[#D4AF37] text-[#0F3A5F] hover:bg-[#FBF8EF]"
                >
                  <ExternalLink className="mr-2" size={16} />
                  Preview Brochure
                </Button>
              )}

              {documents[project.slug]?.map?.data && (
                <Button
                  variant="outline"
                  onClick={() => window.open(documents[project.slug].map.data, '_blank')}
                  className="border-[#D4AF37] text-[#0F3A5F] hover:bg-[#FBF8EF]"
                >
                  <ExternalLink className="mr-2" size={16} />
                  Preview Site Plan
                </Button>
              )}
            </div>

            {/* Status Display */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  documents[project.slug]?.brochure?.data ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-gray-600">
                  Brochure: {documents[project.slug]?.brochure?.data ? 'Uploaded' : 'Not uploaded'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  documents[project.slug]?.map?.data ? 'bg-green-500' : 'bg-gray-300'
                }`} />
                <span className="text-gray-600">
                  Site Plan: {documents[project.slug]?.map?.data ? 'Uploaded' : 'Not uploaded'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Help Section */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p><strong>Q: What happens after I save?</strong></p>
          <p>A: The "Download Brochure" and "Download Site Plan" buttons will appear immediately on the project detail page.</p>
          
          <p className="pt-2"><strong>Q: Can I update documents later?</strong></p>
          <p>A: Yes! Just paste a new URL and click "Save Documents" again. The old link will be replaced.</p>
          
          <p className="pt-2"><strong>Q: What file types are supported?</strong></p>
          <p>A: PDF files are recommended. Make sure the URL points to a downloadable file.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDocsManager;
