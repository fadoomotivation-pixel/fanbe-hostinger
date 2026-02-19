import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Map, Upload, Download, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { getAllProjectDocs, saveProjectDocs } from '@/lib/contentStorage';
import { broadcastContentUpdate, EVENTS } from '@/lib/contentSyncService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const projectsList = [
  { slug: 'shree-kunj-bihari', name: 'Shree Kunj Bihari' },
  { slug: 'khatu-shyam-enclave', name: 'Khatu Shyam Enclave' },
  { slug: 'jagannath-dham', name: 'Jagannath Dham' },
  { slug: 'brij-vatika', name: 'Brij Vatika' },
  { slug: 'gokul-vatika', name: 'Gokul Vatika' },
  { slug: 'maa-simri-vatika', name: 'Maa Simri Vatika' },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const ProjectDocumentsPage = () => {
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState(projectsList[0].slug);
  const [allDocs, setAllDocs] = useState({});
  const [uploadProgress, setUploadProgress] = useState({ brochure: 0, map: 0 });
  const [uploading, setUploading] = useState({ brochure: false, map: false });

  useEffect(() => {
    loadAllDocs();
  }, []);

  const loadAllDocs = () => {
    const docs = getAllProjectDocs();
    setAllDocs(docs);
  };

  const getCurrentDocs = () => {
    return allDocs[selectedProject] || { brochure: null, map: null };
  };

  const handleFileUpload = async (docType, file) => {
    if (!file) return;

    // Validation
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: `Maximum file size is 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB`,
        variant: 'destructive'
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Only PDF, JPG, and PNG files are allowed.',
        variant: 'destructive'
      });
      return;
    }

    // Start upload
    setUploading(prev => ({ ...prev, [docType]: true }));
    setUploadProgress(prev => ({ ...prev, [docType]: 0 }));

    try {
      // Read file as base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(prev => ({ ...prev, [docType]: percentComplete }));
          }
        };

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        
        reader.readAsDataURL(file);
      });

      // Small delay to ensure 100% is visible
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Save document
      const currentDocs = getCurrentDocs();
      const updatedDocs = {
        ...currentDocs,
        [docType]: {
          filename: file.name,
          type: file.type,
          size: file.size,
          data: base64Data,
          uploadedAt: new Date().toISOString()
        }
      };

      const result = saveProjectDocs(selectedProject, updatedDocs);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save document');
      }

      // Update UI
      loadAllDocs();
      broadcastContentUpdate(EVENTS.PROJECT_DOCS_UPDATED, { slug: selectedProject });
      
      toast({
        title: '✅ Upload Successful',
        description: `${docType === 'brochure' ? 'Brochure' : 'Site Plan'} uploaded successfully!`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Something went wrong. Please try again.';
      
      // Check for localStorage quota exceeded
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        errorMessage = 'Storage quota exceeded. Please delete some documents or clear browser data.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      // Reset upload state
      setUploading(prev => ({ ...prev, [docType]: false }));
      setUploadProgress(prev => ({ ...prev, [docType]: 0 }));
    }
  };

  const handleDownload = (docType) => {
    const doc = getCurrentDocs()[docType];
    if (!doc) return;

    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Download Started',
      description: `${doc.filename} is downloading...`
    });
  };

  const handleDelete = (docType) => {
    if (!window.confirm(`Are you sure you want to delete this ${docType === 'brochure' ? 'brochure' : 'site plan'}?`)) {
      return;
    }

    const currentDocs = getCurrentDocs();
    const updatedDocs = {
      ...currentDocs,
      [docType]: null
    };

    const result = saveProjectDocs(selectedProject, updatedDocs);
    
    if (result.success) {
      loadAllDocs();
      broadcastContentUpdate(EVENTS.PROJECT_DOCS_UPDATED, { slug: selectedProject });
      
      toast({
        title: 'Deleted',
        description: `${docType === 'brochure' ? 'Brochure' : 'Site Plan'} deleted successfully.`
      });
    }
  };

  const currentDocs = getCurrentDocs();
  const selectedProjectName = projectsList.find(p => p.slug === selectedProject)?.name;

  const renderDocumentCard = (docType, icon, title) => {
    const doc = currentDocs[docType];
    const isUploading = uploading[docType];
    const progress = uploadProgress[docType];

    return (
      <Card className="border-2 hover:border-[#D4AF37] transition-all">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#0F3A5F]">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>
            Upload {title.toLowerCase()} for this project (PDF, JPG, PNG - Max 10MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div>
            <Label htmlFor={`${docType}-upload`} className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 hover:border-[#D4AF37] rounded-lg p-8 text-center transition-all bg-gray-50 hover:bg-blue-50">
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">
                  PDF, JPG, PNG (Max 10MB)
                </p>
              </div>
            </Label>
            <input
              id={`${docType}-upload`}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                handleFileUpload(docType, e.target.files[0]);
                e.target.value = ''; // Reset input
              }}
              disabled={isUploading}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#0F3A5F] font-medium">
                  {progress === 100 ? 'Saving...' : 'Uploading...'}
                </span>
                <span className="text-[#D4AF37] font-bold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Current Document */}
          {doc && !isUploading && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Document Uploaded</span>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <p><strong>Filename:</strong> {doc.filename}</p>
                <p><strong>Size:</strong> {(doc.size / 1024).toFixed(2)} KB</p>
                <p><strong>Uploaded:</strong> {new Date(doc.uploadedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleDownload(docType)}
                  size="sm"
                  className="bg-[#0F3A5F] hover:bg-[#0a2742] text-white"
                >
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
                <Button
                  onClick={() => handleDelete(docType)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}

          {!doc && !isUploading && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">No document uploaded</p>
                <p className="text-xs">Upload a {title.toLowerCase()} to make it available on the project page.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0F3A5F]">📄 Project Documents</h1>
          <p className="text-gray-600 mt-1">Upload brochures and site plans for your projects</p>
        </div>
      </div>

      {/* Project Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#0F3A5F]">Select Project</CardTitle>
          <CardDescription>Choose a project to manage its documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projectsList.map((project) => (
                <SelectItem key={project.slug} value={project.slug}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-2">
            Currently managing: <span className="font-bold text-[#0F3A5F]">{selectedProjectName}</span>
          </p>
        </CardContent>
      </Card>

      {/* Document Upload Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {renderDocumentCard('brochure', <FileText className="w-5 h-5" />, 'Project Brochure')}
        {renderDocumentCard('map', <Map className="w-5 h-5" />, 'Site Plan / Map')}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">📌 Important Notes:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Documents are stored locally in browser storage</li>
                <li>Maximum file size: 10MB per document</li>
                <li>Supported formats: PDF, JPG, PNG</li>
                <li>Documents appear automatically on project detail pages</li>
                <li>Changes are visible immediately after upload</li>
                <li>If upload gets stuck, try a smaller file or clear browser cache</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDocumentsPage;
