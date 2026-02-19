import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, Loader2, Image as ImageIcon, MapPin, CheckCircle } from 'lucide-react';
import { projectsData } from '@/data/projectsData';
import { getProjectContent, saveProjectContent } from '@/lib/contentStorage';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerContentUpdate, EVENTS } from '@/lib/contentSyncService';

const BUCKET = 'project-images';

const uploadToSupabase = async (file, slug) => {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `projects/${slug}/hero.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

const ProjectImageManager = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState({});
  const [justUpdated, setJustUpdated] = useState({});

  const [projectImages, setProjectImages] = useState(() =>
    projectsData.reduce((acc, p) => {
      const saved = getProjectContent(p.slug);
      acc[p.slug] = saved?.heroImage || p.heroImage;
      return acc;
    }, {})
  );

  const handleFileChange = async (e, slug, projectTitle) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image under 2MB.',
        variant: 'destructive',
      });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: 'Invalid format',
        description: 'Only JPG, PNG, or WebP images are allowed.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(prev => ({ ...prev, [slug]: true }));
    setJustUpdated(prev => ({ ...prev, [slug]: false }));

    try {
      const publicUrl = await uploadToSupabase(file, slug);
      const existing = getProjectContent(slug) || {};
      saveProjectContent(slug, { ...existing, heroImage: publicUrl });

      // Save to Supabase DB so all visitors (not just this browser) see the new image
      await supabaseAdmin
        .from('project_content')
        .upsert({ slug, hero_image: publicUrl, updated_at: new Date().toISOString() });

      setProjectImages(prev => ({ ...prev, [slug]: publicUrl }));
      triggerContentUpdate(EVENTS.PROJECT_IMAGE_UPDATED, { slug });
      setJustUpdated(prev => ({ ...prev, [slug]: true }));
      toast({ title: 'Image Updated', description: `${projectTitle} hero image updated successfully.` });
      setTimeout(() => setJustUpdated(prev => ({ ...prev, [slug]: false })), 3000);
    } catch (err) {
      toast({
        title: 'Upload Failed',
        description: err.message || 'Could not upload image. Check Supabase storage bucket.',
        variant: 'destructive',
      });
    } finally {
      setUploading(prev => ({ ...prev, [slug]: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Project Hero Images</h2>
          <p className="text-sm text-gray-500">
            Upload a new image for each project. Changes are reflected on the website immediately.
          </p>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 border rounded px-3 py-1.5">
          Bucket: <code className="font-mono">project-images</code>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projectsData.map(project => {
          const isUploading = uploading[project.slug];
          const isDone = justUpdated[project.slug];
          const currentImage = projectImages[project.slug];

          return (
            <Card
              key={project.slug}
              className={`overflow-hidden border shadow-sm hover:shadow-md transition-shadow ${
                isDone ? 'border-green-400' : 'border-gray-200'
              }`}
            >
              {/* Image Preview */}
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={project.title}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                    <ImageIcon size={40} />
                  </div>
                )}

                {/* Upload overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <div className="text-center text-white">
                      <Loader2 className="animate-spin h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Uploading to Supabase...</p>
                    </div>
                  </div>
                )}

                {/* Success badge */}
                {isDone && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle size={12} />
                    Updated
                  </div>
                )}

                {/* Project index badge */}
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                  {projectsData.indexOf(project) + 1}/{projectsData.length}
                </div>
              </div>

              {/* Info + Upload Button */}
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{project.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <MapPin size={11} />
                    <span>{project.location}</span>
                  </div>
                </div>

                <label className="cursor-pointer block w-full">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={e => handleFileChange(e, project.slug, project.title)}
                    disabled={isUploading}
                  />
                  <Button
                    variant={isDone ? 'default' : 'outline'}
                    size="sm"
                    className={`w-full pointer-events-none ${
                      isDone ? 'bg-green-600 hover:bg-green-600 text-white border-green-600' : ''
                    }`}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : isDone ? (
                      <>
                        <CheckCircle size={14} className="mr-2" />
                        Image Updated
                      </>
                    ) : (
                      <>
                        <Upload size={14} className="mr-2" />
                        Change Image
                      </>
                    )}
                  </Button>
                </label>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Image Guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 space-y-1">
        <p className="font-semibold">Image Recommendations</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-800">
          <li>
            <strong>Format:</strong> Use <strong>JPEG</strong> for photos (smaller file size, faster loading).
            Use PNG only if the image has transparency.
          </li>
          <li>
            <strong>Dimensions:</strong> <strong>1280×720px</strong> (16:9 ratio) — ideal for hero banners.
          </li>
          <li>
            <strong>File size:</strong> Keep under <strong>300KB</strong> for fast web loading. Max upload: 2MB.
          </li>
          <li>
            <strong>JPEG quality:</strong> Export at 80–85% quality — best balance of size and sharpness.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProjectImageManager;
