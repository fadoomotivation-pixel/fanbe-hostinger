
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit2, Plus, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const WhatsAppTemplates = () => {
  const { waTemplates, addWaTemplate, updateWaTemplate, deleteWaTemplate } = useCRMData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState(null);
  const [formData, setFormData] = useState({ name: '', content: '' });

  const variables = ['[Client Name]', '[Project Name]', '[Lead Source]', '[Assigned Executive Name]'];

  const handleOpenModal = (tpl = null) => {
    if (tpl) {
      setEditingTpl(tpl);
      setFormData({ name: tpl.name, content: tpl.content });
    } else {
      setEditingTpl(null);
      setFormData({ name: '', content: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (editingTpl) {
      updateWaTemplate(editingTpl.id, formData);
    } else {
      addWaTemplate(formData);
    }
    setIsModalOpen(false);
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({ ...prev, content: prev.content + ' ' + variable }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#0F3A5F]">WhatsApp Templates</h1>
        <Button onClick={() => handleOpenModal()} className="bg-[#25D366] hover:bg-[#128C7E]">
          <Plus className="mr-2 h-4 w-4" /> Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {waTemplates.map(tpl => (
          <Card key={tpl.id} className="relative group hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-[#0F3A5F]">{tpl.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-3 rounded-lg text-sm text-gray-700 h-32 overflow-y-auto mb-4 border border-green-100">
                {tpl.content}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => handleOpenModal(tpl)}>
                  <Edit2 className="h-4 w-4 text-blue-600" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => deleteWaTemplate(tpl.id)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingTpl ? 'Edit Template' : 'New Template'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Template Name</Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Site Visit Follow-up" />
            </div>
            <div>
              <Label>Message Content</Label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {variables.map(v => (
                  <button 
                    key={v} 
                    onClick={() => insertVariable(v)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded border"
                  >
                    {v}
                  </button>
                ))}
              </div>
              <Textarea 
                value={formData.content} 
                onChange={e => setFormData({...formData, content: e.target.value})} 
                placeholder="Type your message here..."
                rows={6}
              />
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <span className="text-xs font-bold text-green-800 uppercase block mb-1">Preview</span>
              <p className="text-sm text-gray-800">
                {formData.content
                  .replace('[Client Name]', 'Rahul Verma')
                  .replace('[Project Name]', 'Brij Vatika')
                  .replace('[Lead Source]', 'Website')
                  .replace('[Assigned Executive Name]', 'Rajesh Kumar')
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppTemplates;
