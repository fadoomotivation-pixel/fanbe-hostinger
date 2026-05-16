import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitLead } from '@/lib/storage';
import { projectsData } from '@/data/projectsData';
import { CheckCircle2, Loader2 } from 'lucide-react';

const SiteVisitLeadModal = ({ isOpen, onClose, preSelectedProjectSlug }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    project: '',
    callbackTime: 'Anytime'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        project: preSelectedProjectSlug || '',
      }));
      setIsSuccess(false);
      setError('');
    }
  }, [isOpen, preSelectedProjectSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.phone || !formData.project) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.phone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await submitLead({
        name: formData.name,
        phone: formData.phone,
        projectSlug: formData.project,
        preferredCallbackTime: formData.callbackTime
      });

      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setFormData({ name: '', phone: '', project: '', callbackTime: 'Anytime' });
        }, 3000);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Failed to submit. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#0F3A5F]">Book a Free Site Visit</DialogTitle>
          <DialogDescription>
            Visit our premium projects in person. We provide free pick and drop facility.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Request Received!</h3>
              <p className="text-gray-500 max-w-xs mx-auto">Our sales team will contact you shortly to confirm your visit.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter your name"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Enter 10-digit number"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Interested Project *</Label>
              <Select 
                value={formData.project} 
                onValueChange={(val) => setFormData({...formData, project: val})}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projectsData.map(p => (
                    <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Preferred Callback Time</Label>
              <Select 
                value={formData.callbackTime} 
                onValueChange={(val) => setFormData({...formData, callbackTime: val})}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Anytime">Anytime (9 AM - 7 PM)</SelectItem>
                  <SelectItem value="Morning">Morning (9 AM - 12 PM)</SelectItem>
                  <SelectItem value="Afternoon">Afternoon (12 PM - 4 PM)</SelectItem>
                  <SelectItem value="Evening">Evening (4 PM - 7 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <Button type="submit" className="w-full h-12 bg-[#0F3A5F] hover:bg-[#0a2742] text-white font-bold text-base" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                'Book Site Visit Now'
              )}
            </Button>
            
            <p className="text-xs text-gray-400 text-center px-4">
              We respect your privacy. We never share your details with third parties. Genuine sales outreach only.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SiteVisitLeadModal;