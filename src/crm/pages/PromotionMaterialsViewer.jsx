
import React from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Video, Download } from 'lucide-react';

const PromotionMaterialsViewer = () => {
  const { promoMaterials } = useCRMData();
  const publicMaterials = promoMaterials.filter(m => m.visibility === 'public');

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Promotion Materials</h1>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicMaterials.map(mat => (
              <Card key={mat.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center relative group">
                      {mat.type === 'image' && <img src={mat.url} alt={mat.name} className="w-full h-full object-cover" />}
                      {mat.type === 'video' && <div className="text-gray-400"><Video size={48} /></div>}
                      {mat.type === 'document' && <div className="text-gray-400"><FileText size={48} /></div>}
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a href={mat.url} download={mat.name}>
                             <Button variant="secondary"><Download className="mr-2 h-4 w-4" /> Download</Button>
                          </a>
                      </div>
                  </div>
                  <CardContent className="p-4">
                      <h3 className="font-bold truncate" title={mat.name}>{mat.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{mat.description || 'No description'}</p>
                      <div className="flex justify-between mt-3 text-xs text-gray-400">
                          <span>{mat.project}</span>
                          <span>{mat.size}</span>
                      </div>
                  </CardContent>
              </Card>
          ))}
          {publicMaterials.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                  No promotion materials available yet.
              </div>
          )}
       </div>
    </div>
  );
};

export default PromotionMaterialsViewer;
