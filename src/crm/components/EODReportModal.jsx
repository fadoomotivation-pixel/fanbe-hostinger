
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';

const EODReportModal = ({ isOpen, onClose, onSaveSuccess }) => {
  const { user } = useAuth();
  const { saveDailyWorkLog } = useCRMData();
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    totalCalls: '',
    connectedCalls: '',
    siteVisits: '',
    majorObjection: '',
    token: '',
    customObjection: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.totalCalls) newErrors.totalCalls = 'Total calls required';
    if (!formData.connectedCalls) newErrors.connectedCalls = 'Connected calls required';
    if (Number(formData.connectedCalls) > Number(formData.totalCalls)) newErrors.connectedCalls = 'Cannot exceed total calls';
    if (!formData.siteVisits) newErrors.siteVisits = 'Site visits required';
    if (Number(formData.siteVisits) > Number(formData.connectedCalls)) newErrors.siteVisits = 'Cannot exceed connected calls';
    if (!formData.majorObjection) newErrors.majorObjection = 'Please select a major objection';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const objection = formData.majorObjection === 'Other' ? formData.customObjection : formData.majorObjection;
      
      const logData = {
        employeeId: user.id,
        date: today,
        totalCalls: Number(formData.totalCalls),
        connectedCalls: Number(formData.connectedCalls),
        siteVisits: Number(formData.siteVisits),
        majorObjection: objection,
        token: Number(formData.token) || 0
      };

      await saveDailyWorkLog(logData);
      
      toast({ title: "Success", description: "Daily report saved successfully!" });
      onSaveSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save report.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="w-[95vw] max-w-lg p-0 overflow-hidden rounded-xl">
        <div className="p-6 bg-[#0F3A5F] text-white">
          <DialogTitle className="text-xl font-bold">End of Day Report</DialogTitle>
          <DialogDescription className="text-blue-100">
            Please complete your daily report for <span className="font-bold text-white">{new Date().toDateString()}</span> before logging out.
          </DialogDescription>
        </div>
        
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Total Calls Done <span className="text-red-500">*</span></Label>
            <Input 
              type="number" 
              placeholder="0"
              value={formData.totalCalls}
              onChange={(e) => setFormData({...formData, totalCalls: e.target.value})}
              className={`h-11 ${errors.totalCalls ? 'border-red-500' : ''}`}
            />
            {errors.totalCalls && <p className="text-xs text-red-500">{errors.totalCalls}</p>}
          </div>

          <div className="space-y-2">
            <Label>Connected Calls <span className="text-red-500">*</span></Label>
            <Input 
              type="number" 
              placeholder="0"
              value={formData.connectedCalls}
              onChange={(e) => setFormData({...formData, connectedCalls: e.target.value})}
              className={`h-11 ${errors.connectedCalls ? 'border-red-500' : ''}`}
            />
            {errors.connectedCalls && <p className="text-xs text-red-500">{errors.connectedCalls}</p>}
          </div>

          <div className="space-y-2">
            <Label>Site Visits Fixed <span className="text-red-500">*</span></Label>
            <Input 
              type="number" 
              placeholder="0"
              value={formData.siteVisits}
              onChange={(e) => setFormData({...formData, siteVisits: e.target.value})}
              className={`h-11 ${errors.siteVisits ? 'border-red-500' : ''}`}
            />
            {errors.siteVisits && <p className="text-xs text-red-500">{errors.siteVisits}</p>}
          </div>

          <div className="space-y-2">
            <Label>Major Objection <span className="text-red-500">*</span></Label>
            <Select 
              value={formData.majorObjection} 
              onValueChange={(val) => setFormData({...formData, majorObjection: val})}
            >
              <SelectTrigger className={`h-11 ${errors.majorObjection ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Select primary objection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Price too high">Price too high</SelectItem>
                <SelectItem value="Location issue">Location issue</SelectItem>
                <SelectItem value="Documentation doubt">Documentation doubt</SelectItem>
                <SelectItem value="Family discussion">Family discussion</SelectItem>
                <SelectItem value="No objection">No objection</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.majorObjection && <p className="text-xs text-red-500">{errors.majorObjection}</p>}
          </div>
          
          {formData.majorObjection === 'Other' && (
             <Input 
               placeholder="Specify objection..." 
               className="h-11"
               value={formData.customObjection}
               onChange={(e) => setFormData({...formData, customObjection: e.target.value})}
             />
          )}

          <div className="space-y-2">
            <Label>Token Amount (₹)</Label>
            <Input 
              type="number" 
              placeholder="0"
              value={formData.token}
              onChange={(e) => setFormData({...formData, token: e.target.value})}
              className="h-11"
            />
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex flex-col gap-3">
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full h-12 text-lg font-bold bg-[#1E88E5] hover:bg-[#1976D2]"
          >
            {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
            Save & Logout
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className="w-full text-gray-500"
          >
            Wait, I'll do it later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EODReportModal;
