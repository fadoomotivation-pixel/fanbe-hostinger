
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Save, RefreshCcw, Eye, Trash2, Plus } from 'lucide-react';
import { getProjectContent, saveProjectContent } from '@/lib/contentStorage';
import { triggerContentUpdate, EVENTS } from '@/lib/contentSyncService';
import PricingTableEditor from './PricingTableEditor';
import ImageUploadSection from './ImageUploadSection';

const EditContentPanel = ({ project, onSave }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing content (merged from storage + static)
    const loadContent = () => {
      const stored = getProjectContent(project.slug);
      setFormData(stored || project);
      setLoading(false);
    };
    loadContent();
  }, [project.slug, project]);

  const handleChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], "New Item"] }));
  };

  const removeItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSaveAll = () => {
    const result = saveProjectContent(project.slug, formData);
    if (result.success) {
      // Trigger update events
      triggerContentUpdate(EVENTS.PROJECT_CONTENT_UPDATED, { slug: project.slug });
      // If hero image changed, trigger image update event as well
      if (formData.heroImage !== project.heroImage) {
         triggerContentUpdate(EVENTS.PROJECT_IMAGE_UPDATED, { slug: project.slug });
      }

      toast({ 
        title: "Changes Saved", 
        description: `Content updated successfully at ${new Date(result.timestamp).toLocaleTimeString()}` 
      });
      if (onSave) onSave(); // Callback to refresh parent
    } else {
      toast({ 
        title: "Error", 
        description: "Failed to save content", 
        variant: "destructive" 
      });
    }
  };
  
  const handleImageUpdate = (newUrl) => {
    handleChange(null, 'heroImage', newUrl);
    // Since we update local state, actual save happens on "Save Changes". 
    // However, ImageUploadSection usually implies immediate upload/preview.
    // If we want real-time update immediately upon upload without full save:
    // We can trigger it here, but `formData` isn't saved yet.
    // Let's stick to triggering on `handleSaveAll`.
  };

  if (loading) return <div className="p-8 text-center">Loading editor...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 min-h-[600px]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Project Content</h2>
          <p className="text-sm text-gray-500">Manage content for {project.title}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none">
            <RefreshCcw size={16} className="mr-2" /> Discard
          </Button>
          <Button onClick={handleSaveAll} className="bg-blue-600 hover:bg-blue-700 flex-1 md:flex-none text-white">
            <Save size={16} className="mr-2" /> Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-12 mb-6 bg-gray-100 p-1">
          <TabsTrigger value="general" className="min-w-[100px]">General</TabsTrigger>
          <TabsTrigger value="media" className="min-w-[100px]">Images</TabsTrigger>
          <TabsTrigger value="pricing" className="min-w-[100px]">Pricing</TabsTrigger>
          <TabsTrigger value="features" className="min-w-[100px]">Features</TabsTrigger>
          <TabsTrigger value="seo" className="min-w-[100px]">SEO</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label>Project Title (H1)</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => handleChange(null, 'title', e.target.value)} 
                className="h-11 text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Subline</Label>
              <Input 
                value={formData.subline} 
                onChange={(e) => handleChange(null, 'subline', e.target.value)} 
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Overview Text</Label>
              <Textarea 
                value={formData.overview} 
                onChange={(e) => handleChange(null, 'overview', e.target.value)} 
                className="min-h-[150px] text-base"
              />
            </div>
            <div className="space-y-2">
              <Label>Location Description</Label>
              <Input 
                value={formData.location} 
                onChange={(e) => handleChange(null, 'location', e.target.value)} 
                className="h-11"
              />
            </div>
          </div>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="media" className="space-y-6">
          <ImageUploadSection 
            currentImage={formData.heroImage}
            projectSlug={project.slug}
            onImageUpdate={handleImageUpdate}
          />
          <div className="bg-yellow-50 p-4 rounded text-sm text-yellow-800">
             Additional gallery management coming soon. Currently editing Hero Image only.
          </div>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <PricingTableEditor projectSlug={project.slug} />
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-8">
          {/* Key Highlights */}
          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <Label className="text-lg">Key Highlights</Label>
               <Button size="sm" variant="ghost" onClick={() => addItem('keyHighlights')} className="text-blue-600">
                 <Plus size={16} className="mr-1" /> Add Item
               </Button>
             </div>
             <div className="space-y-2">
               {formData.keyHighlights?.map((item, idx) => (
                 <div key={idx} className="flex gap-2">
                   <Input 
                     value={item} 
                     onChange={(e) => handleArrayChange('keyHighlights', idx, e.target.value)}
                   />
                   <Button variant="ghost" size="icon" onClick={() => removeItem('keyHighlights', idx)} className="text-red-500">
                     <Trash2 size={16} />
                   </Button>
                 </div>
               ))}
             </div>
          </div>

          {/* Investment Benefits */}
          <div className="space-y-4 pt-4 border-t">
             <div className="flex justify-between items-center">
               <Label className="text-lg">Investment Benefits</Label>
               <Button size="sm" variant="ghost" onClick={() => addItem('investmentBenefits')} className="text-blue-600">
                 <Plus size={16} className="mr-1" /> Add Item
               </Button>
             </div>
             <div className="space-y-2">
               {formData.investmentBenefits?.map((item, idx) => (
                 <div key={idx} className="flex gap-2">
                   <Input 
                     value={item} 
                     onChange={(e) => handleArrayChange('investmentBenefits', idx, e.target.value)}
                   />
                   <Button variant="ghost" size="icon" onClick={() => removeItem('investmentBenefits', idx)} className="text-red-500">
                     <Trash2 size={16} />
                   </Button>
                 </div>
               ))}
             </div>
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-6">
          <div className="space-y-4">
             <div className="space-y-2">
               <Label>Meta Title</Label>
               <Input 
                 value={formData.meta?.title || ''} 
                 onChange={(e) => handleChange('meta', 'title', e.target.value)}
               />
             </div>
             <div className="space-y-2">
               <Label>Meta Description</Label>
               <Textarea 
                 value={formData.meta?.description || ''} 
                 onChange={(e) => handleChange('meta', 'description', e.target.value)}
                 className="min-h-[100px]"
               />
             </div>
             <div className="p-4 bg-gray-50 rounded text-sm text-gray-500">
               URL Slug: <span className="font-mono text-gray-900">{project.slug}</span> (Cannot be changed)
             </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default EditContentPanel;
