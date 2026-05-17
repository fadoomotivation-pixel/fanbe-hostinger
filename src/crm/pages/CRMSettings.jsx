
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { Save, LayoutTemplate, ToggleRight, MessageSquare, Phone, Globe, Edit, Terminal, Users } from 'lucide-react';
import { useWhatsApp } from '@/lib/useWhatsApp';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/permissions';

const CRMSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { phoneNumber, updateNumber } = useWhatsApp();
  const [waInput, setWaInput] = useState(phoneNumber);
  
  const [settings, setSettings] = useState({
    footer: {
      address: '',
      phone: '',
      email: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      twitter: '',
      copyright: '',
      description: ''
    },
    homepageButton: 'view_details',
    motivationFeature: true
  });

  useEffect(() => {
    const stored = localStorage.getItem('crmSettings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleSave = (section) => {
    localStorage.setItem('crmSettings', JSON.stringify(settings));
    toast({
      title: "Success",
      description: `${section} updated successfully!`,
      className: "bg-green-50 border-green-200"
    });
  };

  const saveWhatsApp = () => {
      if(waInput.length !== 10) {
          toast({ title: "Error", description: "Phone must be 10 digits", variant: "destructive" });
          return;
      }
      updateNumber(waInput);
      toast({ title: "Updated", description: "WhatsApp number updated globally." });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-[#0F3A5F]">CRM Settings</h1>
           <p className="text-gray-500">Configure global website settings and features.</p>
        </div>
        <Link to="/crm/admin/cms/promotion-materials">
           <Button variant="outline">Manage Promo Materials</Button>
        </Link>
      </div>

      {/* Super Admin Content Editor Link */}
      {user?.role === ROLES.SUPER_ADMIN && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                <CardTitle className="text-blue-800 flex items-center gap-2">
                    <Globe size={20} /> Homepage Content
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <p className="text-sm text-blue-700">Customize hero section, stats, featured projects, and team members directly.</p>
                <Link to="/crm/homepage-content-editor">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        <Edit className="mr-2 h-4 w-4" /> Edit Homepage Content
                    </Button>
                </Link>
                </CardContent>
            </Card>

            <Card className="border-gray-800 bg-[#1a1a1a]">
                <CardHeader>
                <CardTitle className="text-[#10b981] flex items-center gap-2">
                    <Terminal size={20} /> Developer Console
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <p className="text-sm text-gray-400">Advanced tools: ZIP deployment, file manager, rollback, and system logs.</p>
                <Link to="/crm/developer-console">
                    <Button className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold">
                        <Terminal className="mr-2 h-4 w-4" /> Open Console
                    </Button>
                </Link>
                </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                <CardTitle className="text-purple-800 flex items-center gap-2">
                    <Users size={20} /> Employee Management
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <p className="text-sm text-purple-700">Add, edit, or delete employees. Manage roles, usernames, and access.</p>
                <Link to="/crm/admin/employee-management">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        <Users className="mr-2 h-4 w-4" /> Manage Employees
                    </Button>
                </Link>
                </CardContent>
            </Card>
         </div>
      )}

      {/* WhatsApp Settings */}
      <Card className="border-green-200 bg-green-50">
          <CardHeader><CardTitle className="text-green-800 flex items-center gap-2"><Phone size={20}/> Global WhatsApp Number</CardTitle></CardHeader>
          <CardContent>
              <div className="flex gap-4 items-end max-w-md">
                  <div className="flex-1 space-y-2">
                      <Label>WhatsApp Business Number</Label>
                      <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                              +91
                          </span>
                          <Input 
                              className="rounded-l-none" 
                              value={waInput} 
                              onChange={(e) => setWaInput(e.target.value.replace(/[^0-9]/g, ''))}
                              maxLength={10}
                          />
                      </div>
                  </div>
                  <Button onClick={saveWhatsApp} className="bg-green-600 hover:bg-green-700">Update Number</Button>
              </div>
              <p className="text-xs text-green-700 mt-2">This number will be used for all WhatsApp buttons on the website.</p>
          </CardContent>
      </Card>

      {/* Homepage Button Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutTemplate size={20} />
            Homepage Action Button
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Select Primary Action Button Behavior</Label>
            <RadioGroup 
              value={settings.homepageButton} 
              onValueChange={(val) => setSettings({...settings, homepageButton: val})}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="view_details" id="r1" />
                <Label htmlFor="r1">View Details</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="download_brochure" id="r2" />
                <Label htmlFor="r2">Download Brochure</Label>
              </div>
            </RadioGroup>
          </div>
          <Button onClick={() => handleSave('Button settings')} className="mt-4">Save Button Settings</Button>
        </CardContent>
      </Card>

      {/* Footer Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={20} />
            Footer Content Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Company Address</Label>
              <Textarea 
                value={settings.footer.address} 
                onChange={(e) => setSettings({...settings, footer: {...settings.footer, address: e.target.value}})}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Footer Description</Label>
              <Textarea 
                value={settings.footer.description} 
                onChange={(e) => setSettings({...settings, footer: {...settings.footer, description: e.target.value}})}
                rows={3}
              />
            </div>
          </div>

          <Button onClick={() => handleSave('Footer content')} className="w-full md:w-auto">
            <Save className="mr-2 h-4 w-4" /> Save Footer Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CRMSettings;
