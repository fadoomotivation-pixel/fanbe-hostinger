
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, Image as ImageIcon, Video, Trash2, Eye } from 'lucide-react';
import projects from '@/data/projects';

const PromotionMaterialsManager = () => {
  const { promoMaterials, addPromoMaterial, deletePromoMaterial } = useCRMData();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '', type: 'image', description: '', project: 'all', visibility: 'public', file: null
  });
  const [filterType, setFilterType] = useState('all');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic size check
      if (file.type.startsWith('video/') && file.size > 100 * 1024 * 1024) {
          toast({ title: "Too Large", description: "Videos max 100MB", variant: "destructive" });
          return;
      }
      setFormData({...formData, file});
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if(!formData.file) {
        toast({ title: "Error", description: "Select a file", variant: "destructive" });
        return;
    }

    // In a real app, upload to storage bucket here.
    // For this prototype, we fake it with object URL or similar meta data
    const newMaterial = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        project: formData.project,
        visibility: formData.visibility,
        size: (formData.file.size / 1024 / 1024).toFixed(2) + ' MB',
        // Mock URL
        url: URL.createObjectURL(formData.file) 
    };
    
    addPromoMaterial(newMaterial);
    toast({ title: "Success", description: "Material uploaded successfully" });
    setFormData({ name: '', type: 'image', description: '', project: 'all', visibility: 'public', file: null });
  };

  const filteredMaterials = promoMaterials.filter(m => filterType === 'all' || m.type === filterType);

  return (
    <div className="space-y-6">
       <h1 className="text-2xl font-bold text-[#0F3A5F]">Promotion Materials (Super Admin)</h1>

       <Card>
          <CardHeader><CardTitle>Upload New Material</CardTitle></CardHeader>
          <CardContent>
             <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Material Name</label>
                        <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Type</label>
                        <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="image">Image (JPG/PNG)</SelectItem>
                                <SelectItem value="video">Video (MP4/WebM)</SelectItem>
                                <SelectItem value="document">Document (PDF)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Related Project</label>
                        <Select value={formData.project} onValueChange={v => setFormData({...formData, project: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">General / All</SelectItem>
                                {projects.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Visibility</label>
                        <RadioGroup 
                           value={formData.visibility} 
                           onValueChange={v => setFormData({...formData, visibility: v})}
                           className="flex space-x-4 mt-2"
                        >
                           <div className="flex items-center space-x-2">
                               <RadioGroupItem value="public" id="pub" />
                               <label htmlFor="pub">Public (All Staff)</label>
                           </div>
                           <div className="flex items-center space-x-2">
                               <RadioGroupItem value="private" id="priv" />
                               <label htmlFor="priv">Private (Admins)</label>
                           </div>
                        </RadioGroup>
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">Description</label>
                    <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="border-2 border-dashed p-6 text-center rounded-lg">
                    <input type="file" onChange={handleFileChange} className="block mx-auto" />
                    <p className="text-xs text-gray-500 mt-2">Max 100MB Video, 10MB Image</p>
                </div>
                <Button type="submit">Upload Material</Button>
             </form>
          </CardContent>
       </Card>

       <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Existing Materials</CardTitle>
              <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="image">Images</SelectItem>
                      <SelectItem value="video">Videos</SelectItem>
                      <SelectItem value="document">Documents</SelectItem>
                  </SelectContent>
              </Select>
          </CardHeader>
          <CardContent>
             <div className="space-y-2">
                 {filteredMaterials.map(mat => (
                     <div key={mat.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-gray-100 rounded">
                                 {mat.type === 'image' ? <ImageIcon size={20} /> : mat.type === 'video' ? <Video size={20} /> : <FileText size={20} />}
                             </div>
                             <div>
                                 <p className="font-medium">{mat.name}</p>
                                 <p className="text-xs text-gray-500">{mat.project} • {mat.size} • {new Date(mat.uploadDate).toLocaleDateString()}</p>
                             </div>
                         </div>
                         <div className="flex gap-2">
                             <Button variant="ghost" size="sm"><Eye size={16} /></Button>
                             <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deletePromoMaterial(mat.id)}><Trash2 size={16} /></Button>
                         </div>
                     </div>
                 ))}
                 {filteredMaterials.length === 0 && <p className="text-center text-gray-500 py-8">No materials found.</p>}
             </div>
          </CardContent>
       </Card>
    </div>
  );
};

export default PromotionMaterialsManager;
