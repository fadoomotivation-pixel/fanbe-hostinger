import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, MapPin, Upload, Download, Check, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProjectDocs, saveProjectDocs, getAllProjectDocs } from '@/lib/contentStorage';
import { useToast } from '@/components/ui/use-toast';

const projects = [
  { slug: 'shree-kunj-bihari', name: 'Shree Kunj Bihari Enclave' },
  { slug: 'khatu-shyam-enclave', name: 'Khatu Shyam Enclave' },
  { slug: 'jagannath-dham', name: 'Jagannath Dham' },
  { slug: 'brij-vatika', name: 'Brij Vatika' },
  { slug: 'gokul-vatika', name: 'Gokul Vatika' },
  { slug: 'maa-simri-vatika', name: 'Maa Simri Vatika' }
];

const ProjectDocuments = () => {
  const { toast } = useToast();
  const [docs, setDocs] = useState({});
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    setDocs(getAllProjectDocs());
  }, []);

  const handleFileUpload = async (slug, type, file) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = type === 'brochure' 
      ? ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      : ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: `Please upload a valid ${type === 'brochure' ? 'PDF/Image' : 'Image/PDF'} file`,
        variant: 'destructive'
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload a file smaller than 10MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(prev => ({ ...prev, [`${slug}-${type}`]: true }));

    try {
      // Convert to base64 for localStorage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        const currentDocs = getProjectDocs(slug);
        const updatedDocs = {
          ...currentDocs,
          [type]: {
            data: base64,
            filename: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
          }
        };
        
        const result = saveProjectDocs(slug, updatedDocs);
        
        if (result.success) {
          setDocs(getAllProjectDocs());
          toast({
            title: 'Upload Successful',
            description: `${type === 'brochure' ? 'Brochure' : 'Map'} uploaded for ${projects.find(p => p.slug === slug)?.name}`,
          });
        } else {
          throw new Error(result.error);
        }
        
        setUploading(prev => ({ ...prev, [`${slug}-${type}`]: false }));
      };
      
      reader.onerror = () => {
        toast({
          title: 'Upload Failed',
          description: 'Failed to read file',
          variant: 'destructive'
        });
        setUploading(prev => ({ ...prev, [`${slug}-${type}`]: false }));
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive'
      });
      setUploading(prev => ({ ...prev, [`${slug}-${type}`]: false }));
    }
  };

  const handleDelete = (slug, type) => {
    const currentDocs = getProjectDocs(slug);
    const updatedDocs = {
      ...currentDocs,
      [type]: null
    };
    
    const result = saveProjectDocs(slug, updatedDocs);
    
    if (result.success) {
      setDocs(getAllProjectDocs());
      toast({
        title: 'Deleted',
        description: `${type === 'brochure' ? 'Brochure' : 'Map'} removed`,
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0F3A5F] mb-2">Project Documents Manager</h1>
          <p className="text-gray-600">Upload brochures and maps for each project (Max 10MB per file)</p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project, idx) => {
            const projectDocs = docs[project.slug] || {};
            
            return (
              <motion.div
                key={project.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
              >
                {/* Project Header */}
                <div className="bg-gradient-to-r from-[#0F3A5F] to-[#1a5a8f] p-4">
                  <h3 className="text-lg font-bold text-white">{project.name}</h3>
                  <p className="text-xs text-gray-300 mt-1">{project.slug}</p>
                </div>

                <div className="p-5 space-y-4">
                  {/* Brochure Upload */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#D4AF37]" />
                        <span className="font-semibold text-gray-700">Brochure</span>
                      </div>
                      {projectDocs.brochure && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <Check className="w-4 h-4" />
                          Uploaded
                        </div>
                      )}
                    </div>

                    {projectDocs.brochure ? (
                      <div className="bg-gray-50 rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{projectDocs.brochure.filename}</span>
                          <span className="text-xs text-gray-500">{formatFileSize(projectDocs.brochure.size)}</span>
                        </div>
                        <div className="flex gap-2">
                          <a href={projectDocs.brochure.data} download={projectDocs.brochure.filename}>
                            <Button size="sm" variant="outline" className="text-xs">
                              <Download className="w-3 h-3 mr-1" /> Preview
                            </Button>
                          </a>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(project.slug, 'brochure')}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id={`brochure-${project.slug}`}
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileUpload(project.slug, 'brochure', e.target.files[0])}
                        />
                        <label htmlFor={`brochure-${project.slug}`}>
                          <Button 
                            size="sm" 
                            className="w-full bg-[#D4AF37] hover:bg-[#B8941E] text-black"
                            disabled={uploading[`${project.slug}-brochure`]}
                            onClick={() => document.getElementById(`brochure-${project.slug}`).click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading[`${project.slug}-brochure`] ? 'Uploading...' : 'Upload Brochure'}
                          </Button>
                        </label>
                        <p className="text-xs text-gray-400 mt-2 text-center">PDF, JPG, PNG (Max 10MB)</p>
                      </div>
                    )}
                  </div>

                  {/* Map Upload */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#0F3A5F]" />
                        <span className="font-semibold text-gray-700">Location Map</span>
                      </div>
                      {projectDocs.map && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <Check className="w-4 h-4" />
                          Uploaded
                        </div>
                      )}
                    </div>

                    {projectDocs.map ? (
                      <div className="bg-gray-50 rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{projectDocs.map.filename}</span>
                          <span className="text-xs text-gray-500">{formatFileSize(projectDocs.map.size)}</span>
                        </div>
                        <div className="flex gap-2">
                          <a href={projectDocs.map.data} download={projectDocs.map.filename}>
                            <Button size="sm" variant="outline" className="text-xs">
                              <Download className="w-3 h-3 mr-1" /> Preview
                            </Button>
                          </a>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(project.slug, 'map')}
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id={`map-${project.slug}`}
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(project.slug, 'map', e.target.files[0])}
                        />
                        <label htmlFor={`map-${project.slug}`}>
                          <Button 
                            size="sm" 
                            className="w-full bg-[#0F3A5F] hover:bg-[#1a5a8f] text-white"
                            disabled={uploading[`${project.slug}-map`]}
                            onClick={() => document.getElementById(`map-${project.slug}`).click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading[`${project.slug}-map`] ? 'Uploading...' : 'Upload Map'}
                          </Button>
                        </label>
                        <p className="text-xs text-gray-400 mt-2 text-center">JPG, PNG, PDF (Max 10MB)</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Info Alert */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3"
        >
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Upload brochures (PDF/Image) and maps (Image/PDF) for each project</li>
              <li>Files are stored in browser localStorage (max 10MB each)</li>
              <li>Download buttons will appear on individual project detail pages</li>
              <li>Users can download brochures and maps directly from project pages</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectDocuments;
