import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local implementation to replace missing import
  const submitContact = async (data) => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to localStorage for persistence (prototyping)
      const existing = JSON.parse(localStorage.getItem('contact_inquiries') || '[]');
      existing.push({ ...data, date: new Date().toISOString() });
      localStorage.setItem('contact_inquiries', JSON.stringify(existing));
      
      return true;
    } catch (error) {
      console.error('Error submitting contact form:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.email || !formData.message) {
      toast({ title: 'Missing Information', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitContact(formData);
      toast({ title: 'Message Sent!', description: 'We will get back to you shortly.' });
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send message.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-gray-50 min-h-screen"
    >
      <Helmet>
        <title>Contact Us | Fanbe Group</title>
        <meta name="description" content="Get in touch with Fanbe Group for your real estate investment needs." />
      </Helmet>

      {/* Hero */}
      <section className="bg-[#0F3A5F] py-20 text-center text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Let's Discuss Your Investment</h1>
          <p className="text-gray-300">Our experts are ready to guide you.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 bg-white rounded-2xl shadow-xl overflow-hidden">
          
          {/* Contact Details */}
          <div className="bg-[#0F3A5F] p-12 text-white flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-8">Contact Information</h2>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <Phone className="text-[#D4AF37] mt-1" />
                  <div>
                    <div className="font-semibold text-[#D4AF37] mb-1">Phone</div>
                    <a href="tel:+919876543210" className="hover:text-gray-200">+91 98765 43210</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="text-[#D4AF37] mt-1" />
                  <div>
                    <div className="font-semibold text-[#D4AF37] mb-1">Email</div>
                    <a href="mailto:info@fanbegroup.com" className="hover:text-gray-200">info@fanbegroup.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="text-[#D4AF37] mt-1" />
                  <div>
                    <div className="font-semibold text-[#D4AF37] mb-1">Office</div>
                    <p>Mathura-Vrindavan Road,<br />Uttar Pradesh, India</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12">
               <a 
                 href="https://wa.me/919876543210" 
                 target="_blank" 
                 rel="noreferrer"
                 className="inline-flex items-center justify-center w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-lg font-bold transition-colors"
               >
                 Chat on WhatsApp
               </a>
            </div>
          </div>

          {/* Form */}
          <div className="p-12">
            <h2 className="text-2xl font-bold text-[#0F3A5F] mb-6">Send Inquiry</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <input
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0F3A5F]"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Full Name"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <input
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0F3A5F]"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Mobile Number"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <input
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0F3A5F]"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="Email Address"
                  type="email"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0F3A5F] min-h-[120px]"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="How can we help you?"
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" className="w-full bg-[#0F3A5F] hover:bg-[#0a2742] text-white py-3 text-lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <span className="flex items-center">Send Inquiry <Send className="ml-2 h-4 w-4" /></span>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactPage;