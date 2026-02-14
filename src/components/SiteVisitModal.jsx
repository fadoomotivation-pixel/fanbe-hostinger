
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { submitSiteVisit } from '@/lib/storage';
import projects from '@/data/projects';

const SiteVisitModal = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    preferred_project: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.phone.trim()) {
      toast({
        title: 'Phone Required',
        description: 'Please enter your phone number',
        variant: 'destructive'
      });
      return false;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive'
      });
      return false;
    }

    if (!formData.preferred_project) {
      toast({
        title: 'Project Required',
        description: 'Please select a preferred project',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await submitSiteVisit(formData);

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: 'Success!',
          description: 'Your site visit request has been submitted successfully.',
        });

        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        throw new Error(result.error || 'Failed to submit');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', phone: '', preferred_project: '' });
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#001F3F]">
            Book a Site Visit
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Fill in your details and we'll arrange a free site visit with pick-and-drop facility.
          </DialogDescription>
        </DialogHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-5 mt-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Full Name *
              </Label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066A1] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number *
              </Label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066A1] focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                disabled={isSubmitting}
              />
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="preferred_project" className="text-sm font-medium text-gray-700">
                Preferred Project *
              </Label>
              <select
                id="preferred_project"
                name="preferred_project"
                value={formData.preferred_project}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0066A1] focus:border-transparent outline-none transition-all bg-white text-gray-900"
                disabled={isSubmitting}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.name}>
                    {project.name} - {project.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Free Facility Notice */}
            <div className="bg-[#0066A1]/10 border border-[#0066A1]/30 rounded-lg p-4">
              <p className="text-sm text-[#001F3F] font-medium">
                🚗 Free Pick-and-Drop Facility Available
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0066A1] hover:bg-[#004d7a] text-white py-3 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Book Site Visit'
              )}
            </Button>
          </form>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#001F3F]">Thank You!</h3>
              <p className="text-gray-600">
                We've received your request and will contact you soon to schedule your site visit.
              </p>
              <p className="text-sm text-[#0066A1] font-medium">
                Our team will reach out within 24 hours.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SiteVisitModal;
