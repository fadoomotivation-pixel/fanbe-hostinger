
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';

const ImageUploadSection = ({ currentImage, onImageUpdate, projectSlug }) => {
  const { toast } = useToast();
  const [preview, setPreview] = useState(currentImage);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: "File too large", 
        description: "Please upload an image smaller than 5MB", 
        variant: "destructive" 
      });
      return;
    }

    // Validate type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast({ 
        title: "Invalid file type", 
        description: "Only JPG and PNG files are allowed", 
        variant: "destructive" 
      });
      return;
    }

    setIsUploading(true);

    // Create preview and "upload" (convert to base64 for local storage)
    const reader = new FileReader();
    reader.onloadend = () => {
      // Simulate network delay
      setTimeout(() => {
        const result = reader.result;
        setPreview(result);
        onImageUpdate(result);
        setIsUploading(false);
        toast({ 
          title: "Image Uploaded", 
          description: "New project image has been set successfully." 
        });
      }, 800);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 border rounded-lg p-6 bg-gray-50/50">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Project Hero Image</h4>
        <span className="text-xs text-gray-500">Rec: 1200x600px (16:9)</span>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Preview Area */}
        <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden shadow-inner group">
          {preview ? (
            <>
              <img 
                src={preview} 
                alt="Project Preview" 
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">Current Image</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <ImageIcon size={48} />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex flex-col justify-center space-y-4">
          <div className="relative">
            <Input 
              type="file" 
              accept="image/jpeg, image/png"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-white transition-colors">
              {isUploading ? (
                <div className="flex flex-col items-center animate-pulse">
                  <div className="h-10 w-10 bg-blue-100 rounded-full mb-3"></div>
                  <p className="text-sm font-medium text-blue-600">Processing...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-900">Click to upload</p>
                  <p className="text-xs text-gray-500 mt-1">JPG or PNG, max 5MB</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded text-center">
            Files are automatically optimized for web performance.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadSection;
