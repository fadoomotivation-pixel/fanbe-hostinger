import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Phone, Mail, MapPin, Loader2, Send, MessageCircle, Clock,
  CheckCircle, Users, Building, Shield, ArrowRight, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useWhatsApp } from '@/lib/useWhatsApp';
import { projectsData } from '@/data/projectsData';

const ContactPage = () => {
  const { toast } = useToast();
  const { phoneNumber, getWhatsAppLink } = useWhatsApp();
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', project: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneFormatted = phoneNumber.length === 10
    ? `+91 ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`
    : `+91 ${phoneNumber}`;
  const phoneLink = `tel:+91${phoneNumber}`;

  const submitContact = async (data) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
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
    if (!formData.name || !formData.phone) {
      toast({ title: 'Naam aur Phone number daaliye', description: 'Ye fields zaroori hain.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitContact(formData);
      toast({ title: 'Inquiry Bhej Di Gayi!', description: 'Hum jaldi aapko call karenge.' });
      setFormData({ name: '', phone: '', email: '', project: '', message: '' });
    } catch (error) {
      toast({ title: 'Error', description: 'Message nahi bhej paayi. Dobara try karein.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white min-h-screen"
    >
      <Helmet>
        <title>Humse Baat Karo | Contact Fanbe Group | Plot Inquiry</title>
        <meta name="description" content={`Fanbe Group se baat karo — call ${phoneFormatted}, WhatsApp karo, ya office aao. 25+ projects, 15,000+ families. Free consultation, same day response.`} />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#0F3A5F] via-[#0F3A5F] to-[#1a5a8f] py-16 md:py-24 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 border border-white/20 rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border border-white/20 rounded-full" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-6 py-2 mb-6">
              <span className="text-[#D4AF37] font-semibold text-sm">Free Consultation &bull; Same Day Response &bull; No Pressure</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Baat Karo, Samjho,<br />
              <span className="text-[#D4AF37]">Phir Faisla Karo</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto mb-4">
              Koi bhi sawaal ho — pricing, location, EMI, legal papers —
            </p>
            <p className="text-white text-xl md:text-2xl font-bold max-w-3xl mx-auto mb-8">
              Hum hain na. <span className="text-[#D4AF37]">Pehle samjho, phir kharido.</span>
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <a
                href={getWhatsAppLink('Mujhe plot ke baare mein jaankari chahiye')}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
              >
                <MessageCircle size={22} />
                WhatsApp Pe Pucho
              </a>
              <a
                href={phoneLink}
                className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
              >
                <Phone size={22} />
                Call Karo Abhi
              </a>
            </div>

            <p className="text-blue-200 text-sm">
              {phoneFormatted} &bull; Mon-Sat 9AM - 8PM &bull; Sunday by appointment
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Cards + Form Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-5 gap-8 max-w-6xl mx-auto">

            {/* Left: Contact Info Cards */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-2xl md:text-3xl font-bold text-[#2C2C2C] mb-2">
                  Humse <span className="text-[#D4AF37]">Miliye</span>
                </h2>
                <p className="text-gray-600 mb-6">3 tarike hain — jo aapko easy lage</p>
              </motion.div>

              {/* Phone Card */}
              <motion.a
                href={phoneLink}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="block bg-gradient-to-r from-blue-50 to-white rounded-2xl p-6 border border-blue-100 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0F3A5F] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="text-[#D4AF37]" size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F3A5F] text-lg mb-1">Direct Call Karo</h3>
                    <p className="text-[#D4AF37] font-bold text-xl">{phoneFormatted}</p>
                    <p className="text-gray-500 text-sm mt-1">Mon-Sat: 9AM - 8PM</p>
                  </div>
                </div>
              </motion.a>

              {/* WhatsApp Card */}
              <motion.a
                href={getWhatsAppLink('Mujhe plot ke baare mein details chahiye')}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="block bg-gradient-to-r from-green-50 to-white rounded-2xl p-6 border border-green-100 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MessageCircle className="text-white" size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-700 text-lg mb-1">WhatsApp Pe Pucho</h3>
                    <p className="text-green-600 font-bold text-lg">Turant Reply Milega</p>
                    <p className="text-gray-500 text-sm mt-1">Photo, brochure sab bhejenge</p>
                  </div>
                </div>
              </motion.a>

              {/* Email Card */}
              <motion.a
                href="mailto:info@fanbegroup.com"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="block bg-gradient-to-r from-purple-50 to-white rounded-2xl p-6 border border-purple-100 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="text-white" size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-700 text-lg mb-1">Email Karo</h3>
                    <p className="text-purple-600 font-bold">info@fanbegroup.com</p>
                    <p className="text-gray-500 text-sm mt-1">Detailed inquiry ke liye</p>
                  </div>
                </div>
              </motion.a>

              {/* Office Address Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-r from-yellow-50 to-white rounded-2xl p-6 border border-yellow-100"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
                    <MapPin className="text-[#0F3A5F]" size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F3A5F] text-lg mb-1">Office Aao</h3>
                    <p className="text-gray-700 font-semibold">Plot No. 35, Balaji Tower, 2nd Floor</p>
                    <p className="text-gray-600">Ballabhgarh, Haryana 121004</p>
                    <p className="text-gray-500 text-sm mt-1">Chai ke saath baat karenge</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right: Inquiry Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                {/* Form Header */}
                <div className="bg-[#0F3A5F] px-6 md:px-8 py-6">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                    Apni Inquiry Bhejo
                  </h2>
                  <p className="text-blue-200 text-sm">Hum 2 ghante mein call karenge — guaranteed</p>
                </div>

                {/* Form Body */}
                <div className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Aapka Naam *</Label>
                        <input
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3A5F] focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Poora naam likhein"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-700 font-semibold">Phone Number *</Label>
                        <input
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3A5F] focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="WhatsApp number daalein"
                          type="tel"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Email (optional)</Label>
                      <input
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3A5F] focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="Email address"
                        type="email"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* Project Selection */}
                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Kaun Sa Project Pasand Hai?</Label>
                      <select
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3A5F] focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                        value={formData.project}
                        onChange={(e) => setFormData({...formData, project: e.target.value})}
                        disabled={isSubmitting}
                      >
                        <option value="">-- Project Chuniye --</option>
                        {projectsData.map((project) => (
                          <option key={project.slug} value={project.title}>
                            {project.title} — ₹{project.pricePerSqYard.toLocaleString('en-IN')}/sq yd ({project.location})
                          </option>
                        ))}
                        <option value="Not Sure">Abhi Pata Nahi — Guide Karo</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700 font-semibold">Kuch Kehna Hai? (optional)</Label>
                      <textarea
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0F3A5F] focus:border-transparent transition-all bg-gray-50 focus:bg-white min-h-[100px]"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        placeholder="Budget, plot size, ya koi sawaal..."
                        disabled={isSubmitting}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#0F3A5F] hover:bg-[#0a2742] text-white py-4 text-lg rounded-xl font-bold transition-all hover:shadow-lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Send size={20} />
                          Inquiry Bhejo — Free Hai
                        </span>
                      )}
                    </Button>

                    {/* Trust Points below form */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {[
                        { icon: Clock, text: '2 ghante mein call' },
                        { icon: Shield, text: 'No spam, no pressure' },
                        { icon: CheckCircle, text: 'Free consultation' },
                        { icon: Star, text: 'Expert guidance' }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-gray-500 text-xs">
                          <item.icon size={14} className="text-green-500 flex-shrink-0" />
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Project Cards — "Kaun Sa Project Dekhna Hai?" */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
              Kaun Sa Project Dekhna Hai? <span className="text-[#D4AF37]">Seedha Pucho</span>
            </h2>
            <p className="text-gray-600 text-lg">Ek click mein project team se baat karein</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {projectsData.map((project, idx) => (
              <motion.div
                key={project.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-[#0F3A5F] text-base">{project.title}</h3>
                    <p className="text-gray-500 text-xs flex items-center gap-1">
                      <MapPin size={12} /> {project.location}
                    </p>
                  </div>
                  <div className="bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0">
                    {project.emiInterest} EMI
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4 text-sm">
                  <span className="text-[#0F3A5F] font-bold">₹{project.pricePerSqYard.toLocaleString('en-IN')}/sq yd</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-green-600 font-semibold">EMI ₹{project.pricing[0].emi.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={project.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold text-sm text-center transition-colors flex items-center justify-center gap-1"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                  <Link
                    to={`/projects/${project.slug}`}
                    className="flex-1 bg-[#0F3A5F] hover:bg-[#0d2f4d] text-white py-2 rounded-lg font-semibold text-sm text-center transition-colors flex items-center justify-center gap-1"
                  >
                    Details <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
              Aap Safe Haath Mein Ho — <span className="text-[#D4AF37]">Yeh Raha Proof</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
            {[
              { number: '12+', label: 'Saal Ka Experience', icon: Building },
              { number: '25+', label: 'Projects Delivered', icon: Star },
              { number: '15,000+', label: 'Khush Parivar', icon: Users },
              { number: '100%', label: 'Legal Clarity', icon: Shield }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-5 text-center shadow-md border border-gray-100"
              >
                <stat.icon className="mx-auto text-[#D4AF37] mb-2" size={28} />
                <div className="text-2xl md:text-3xl font-bold text-[#0F3A5F] mb-1">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-3">
            {[
              'Registry turant — koi waiting nahi',
              '0% interest EMI — bank se bhi sasta',
              'No hidden charges — full transparency',
              'Free site visit — koi compulsion nahi',
              'Gated colony — safe aur secure',
              'Dedicated support team — hamesha available'
            ].map((point, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-green-50 rounded-xl p-3 border border-green-100">
                <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
                <span className="text-gray-700 font-medium text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-[#0F3A5F] to-[#1a5a8f] text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Bas Ek Call Karo — <span className="text-[#D4AF37]">Baaki Hum Sambhalenge</span>
            </h2>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-4">
              Pehle samjho, phir socho, phir kharido. Koi pressure nahi — sirf honest guidance.
            </p>
            <p className="text-white text-xl font-bold max-w-2xl mx-auto mb-8">
              <span className="text-[#D4AF37]">{phoneFormatted}</span> — abhi call karo ya WhatsApp karo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <a
                href={getWhatsAppLink('Mujhe plot book karna hai - details bhejo')}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
              >
                <MessageCircle size={22} />
                Abhi WhatsApp Karo
              </a>
              <a
                href={phoneLink}
                className="bg-white hover:bg-gray-100 text-[#0F3A5F] px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
              >
                <Phone size={22} />
                Direct Call Karo
              </a>
            </div>

            {/* Office Address */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md mx-auto border border-white/10">
              <div className="flex items-center justify-center gap-3 text-blue-200">
                <MapPin size={18} className="text-[#D4AF37]" />
                <div className="text-sm text-left">
                  <p className="text-white font-semibold">Plot No. 35, Balaji Tower, 2nd Floor</p>
                  <p>Ballabhgarh, Haryana 121004</p>
                </div>
              </div>
            </div>

            <p className="text-blue-300 text-sm mt-6">
              Free site visit &bull; Free consultation &bull; Same day response guaranteed
            </p>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default ContactPage;
