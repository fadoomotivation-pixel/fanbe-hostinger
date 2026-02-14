import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Star, Upload, Loader2, Save, GripVertical } from 'lucide-react';
import { useHomepageSettings, useSliderData, updateHomepageSettings, updateSliderData } from '@/lib/contentSync';
import { triggerContentUpdate, EVENTS } from '@/lib/contentSyncService';

const HomepageSettings = () => {
  const { toast } = useToast();
  const settings = useHomepageSettings();
  const sliderData = useSliderData();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [localSlider, setLocalSlider] = useState(sliderData);
  const [isSaving, setIsSaving] = useState(false);

  // --- Handlers ---
  const handleToggleChange = (key) => {
    setLocalSettings(prev => ({
      ...prev,
      toggles: { ...prev.toggles, [key]: !prev.toggles[key] }
    }));
  };

  const handleProjectSectionChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      ourProjects: { ...prev.ourProjects, [field]: value }
    }));
  };
  
  const handleCardSettingChange = (field, value) => {
    setLocalSettings(prev => ({
      ...prev,
      ourProjects: { 
        ...prev.ourProjects, 
        cardSettings: { ...prev.ourProjects.cardSettings, [field]: value } 
      }
    }));
  };

  const handleSliderUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image too large (Max 5MB)", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const newImage = {
        id: Date.now(),
        url: reader.result,
        uploadDate: new Date().toISOString(),
        isPrimary: localSlider.images.length === 0
      };
      setLocalSlider(prev => ({ ...prev, images: [...prev.images, newImage] }));
      toast({ title: "Success", description: "Image uploaded successfully" });
    };
    reader.readAsDataURL(file);
  };

  const deleteSliderImage = (id) => {
    setLocalSlider(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== id)
    }));
  };

  const setPrimaryImage = (id) => {
    setLocalSlider(prev => ({
      ...prev,
      images: prev.images.map(img => ({ ...img, isPrimary: img.id === id }))
    }));
  };

  const saveAll = async () => {
    setIsSaving(true);
    // Simulate delay
    await new Promise(r => setTimeout(r, 800));
    
    // Update local storage
    updateHomepageSettings(localSettings);
    updateSliderData(localSlider);

    // Trigger Real-time updates
    triggerContentUpdate(EVENTS.SLIDER_UPDATED, localSlider);
    triggerContentUpdate(EVENTS.HOMEPAGE_SETTINGS_UPDATED, localSettings);
    
    // Note: Menu update is typically handled in NavigationMenuEditor, but adding a generic trigger if applicable
    // triggerContentUpdate(EVENTS.MENU_UPDATED, {}); 
    
    setIsSaving(false);
    
    toast({ 
      title: "Settings Saved", 
      description: "Homepage settings and slider updated in real-time!"
    });
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Homepage Settings</h1>
          <p className="text-gray-500">Customize the look and feel of your homepage</p>
        </div>
        <Button onClick={saveAll} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />}
          Save Changes
        </Button>
      </div>

      {/* Section 1: Hero Slider */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Slider Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-4">
                <Label>Slider Settings</Label>
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <span>Auto Rotate</span>
                  <Switch 
                    checked={localSlider.settings.autoRotate}
                    onCheckedChange={(c) => setLocalSlider(prev => ({...prev, settings: {...prev.settings, autoRotate: c}}))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label className="text-xs mb-1 block">Interval</Label>
                     <Select 
                        value={localSlider.settings.interval.toString()} 
                        onValueChange={(v) => setLocalSlider(prev => ({...prev, settings: {...prev.settings, interval: parseInt(v)}}))}
                      >
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="3000">3 Seconds</SelectItem>
                         <SelectItem value="5000">5 Seconds</SelectItem>
                         <SelectItem value="10000">10 Seconds</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div>
                     <Label className="text-xs mb-1 block">Transition</Label>
                     <Select 
                        value={localSlider.settings.transition} 
                        onValueChange={(v) => setLocalSlider(prev => ({...prev, settings: {...prev.settings, transition: v}}))}
                      >
                       <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Fade">Fade</SelectItem>
                         <SelectItem value="Slide">Slide</SelectItem>
                         <SelectItem value="Zoom">Zoom</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                </div>
             </div>

             <div className="space-y-2">
               <Label>Upload New Slide</Label>
               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative h-full flex flex-col items-center justify-center">
                 <Input 
                   type="file" 
                   accept="image/*" 
                   className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                   onChange={handleSliderUpload}
                 />
                 <Upload className="text-gray-400 mb-2" />
                 <span className="text-sm text-gray-500">Drop image or click to upload</span>
                 <span className="text-xs text-gray-400 mt-1">1920x600px recommended</span>
               </div>
             </div>
          </div>

          <div className="space-y-3">
             <Label>Active Slides</Label>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {localSlider.images.map((img) => (
                 <div key={img.id} className={`relative group rounded-lg overflow-hidden border-2 ${img.isPrimary ? 'border-[#D4AF37]' : 'border-gray-200'}`}>
                   <img src={img.url} alt="slide" className="w-full h-32 object-cover" />
                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <Button 
                        size="icon" variant="secondary" 
                        className={img.isPrimary ? "text-yellow-500" : "text-gray-500"}
                        onClick={() => setPrimaryImage(img.id)}
                        title="Set as Primary"
                      >
                       <Star size={16} fill={img.isPrimary ? "currentColor" : "none"} />
                     </Button>
                     <Button 
                        size="icon" variant="destructive"
                        onClick={() => deleteSliderImage(img.id)}
                      >
                       <Trash2 size={16} />
                     </Button>
                   </div>
                   {img.isPrimary && <div className="absolute top-2 left-2 bg-[#D4AF37] text-[#0F3A5F] text-xs font-bold px-2 py-1 rounded">Primary</div>}
                 </div>
               ))}
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Our Projects Editor */}
      <Card>
        <CardHeader>
          <CardTitle>"Our Projects" Section Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Section Title ({localSettings.ourProjects.title.length}/50)</Label>
                <Input 
                  value={localSettings.ourProjects.title}
                  maxLength={50}
                  onChange={(e) => handleProjectSectionChange('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Text Alignment</Label>
                <Select 
                  value={localSettings.ourProjects.alignment}
                  onValueChange={(v) => handleProjectSectionChange('alignment', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Left">Left</SelectItem>
                    <SelectItem value="Center">Center</SelectItem>
                    <SelectItem value="Right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
               <Label>Subtitle ({localSettings.ourProjects.subtitle.length}/200)</Label>
               <Textarea 
                 value={localSettings.ourProjects.subtitle}
                 maxLength={200}
                 onChange={(e) => handleProjectSectionChange('subtitle', e.target.value)}
                 className="resize-none"
               />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
               <div className="space-y-2">
                 <Label>Card Image Size</Label>
                 <Select 
                    value={localSettings.ourProjects.cardSettings.imageSize}
                    onValueChange={(v) => handleCardSettingChange('imageSize', v)}
                  >
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Small">Small</SelectItem>
                     <SelectItem value="Medium">Medium</SelectItem>
                     <SelectItem value="Large">Large</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Border Radius</Label>
                 <Input 
                    type="number" 
                    value={localSettings.ourProjects.cardSettings.borderRadius}
                    onChange={(e) => handleCardSettingChange('borderRadius', parseInt(e.target.value))}
                  />
               </div>
               <div className="flex items-center space-x-2 pt-8">
                 <Switch 
                   checked={localSettings.ourProjects.cardSettings.textOverlay}
                   onCheckedChange={(c) => handleCardSettingChange('textOverlay', c)}
                 />
                 <Label>Text Overlay</Label>
               </div>
               <div className="flex items-center space-x-2 pt-8">
                 <Switch 
                   checked={localSettings.ourProjects.cardSettings.hoverEffect}
                   onCheckedChange={(c) => handleCardSettingChange('hoverEffect', c)}
                 />
                 <Label>Hover Effects</Label>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Section Toggles */}
      <Card>
        <CardHeader>
          <CardTitle>Homepage Sections Toggle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Object.entries(localSettings.toggles).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <span className="font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <Switch 
                  checked={value}
                  onCheckedChange={() => handleToggleChange(key)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomepageSettings;