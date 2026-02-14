
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const MasterSettings = () => {
  const { settings, updateSettings } = useCRMData();
  const { toast } = useToast();
  const [tempSettings, setTempSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(tempSettings);
    toast({ title: 'Saved', description: 'System settings updated.' });
  };

  return (
    <div className="max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">Master Settings</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <h2 className="text-lg font-bold">System Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Company Name</label>
            <input 
              className="w-full p-2 border rounded" 
              value={tempSettings.company.name} 
              onChange={e => setTempSettings({...tempSettings, company: {...tempSettings.company, name: e.target.value}})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Support Phone</label>
             <input 
              className="w-full p-2 border rounded" 
              value={tempSettings.company.phone} 
              onChange={e => setTempSettings({...tempSettings, company: {...tempSettings.company, phone: e.target.value}})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Session Timeout (minutes)</label>
             <input 
              type="number"
              className="w-full p-2 border rounded" 
              value={tempSettings.sessionTimeout} 
              onChange={e => setTempSettings({...tempSettings, sessionTimeout: parseInt(e.target.value)})} 
            />
          </div>
        </div>
        <Button onClick={handleSave} className="bg-[#0F3A5F]">Save Changes</Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-bold mb-4">Lead Statuses (Read Only in Demo)</h2>
        <div className="flex flex-wrap gap-2">
          {settings.leadStatuses.map(s => <span key={s} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{s}</span>)}
        </div>
      </div>
    </div>
  );
};

export default MasterSettings;
