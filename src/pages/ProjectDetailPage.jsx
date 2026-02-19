import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { projectsData } from '@/data/projectsData';
import { Button } from '@/components/ui/button';
import { 
  Check, MapPin, MessageCircle, TrendingUp, FileText, Map, Download,
  Home, Shield, Zap, Droplet, Trees, Car, School, Heart,
  ShoppingBag, Train, ChevronDown, ChevronUp, Phone, IndianRupee,
  Building2, Calendar, Award
} from 'lucide-react';
import { getProjectContent, getPricingTable, getProjectImagesFromDB, getProjectDocs } from '@/lib/contentStorage';
import { subscribeToContentUpdates, EVENTS } from '@/lib/contentSyncService';
import SiteVisitLeadModal from '@/components/SiteVisitLeadModal';
import { useToast } from '@/components/ui/use-toast';

const ProjectDetailPage = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [pricing, setPricing] = useState([]);
  const [docs, setDocs] = useState({ brochure: null, map: null });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  const loadData = async () => {
    const staticProject = projectsData.find(p => p.slug === slug);
    if (!staticProject) {
      setLoading(false);
      return;
    }

    const dynamicContent = getProjectContent(slug);
    const dynamicPricing = getPricingTable(slug);
    const projectDocs = getProjectDocs(slug); // This loads from CMS

    const dbImages = await getProjectImagesFromDB();
    const heroImage = dbImages[slug] || dynamicContent?.heroImage || staticProject.heroImage;

    const mergedProject = { ...staticProject, ...(dynamicContent || {}), heroImage };
    const finalPricing = (dynamicPricing && dynamicPricing.length > 0) ? dynamicPricing : staticProject.pricing;

    setProject(mergedProject);
    setPricing(finalPricing);
    setDocs(projectDocs); // Documents from CMS
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const unsubscribeImage = subscribeToContentUpdates(EVENTS.PROJECT_IMAGE_UPDATED, (data) => {
      if (!data.data.slug || data.data.slug === slug) {
        loadData();
        toast({ title: "Updated", description: "Project image updated!" });
      }
    });

    const unsubscribeContent = subscribeToContentUpdates(EVENTS.PROJECT_CONTENT_UPDATED, (data) => {
      if (!data.data.slug || data.data.slug === slug) {
        loadData();
        toast({ title: "Updated", description: "Project content updated!" });
      }
    });

    const unsubscribeDocs = subscribeToContentUpdates(EVENTS.PROJECT_DOCS_UPDATED, (data) => {
      if (!data.data.slug || data.data.slug === slug) {
        loadData();
        toast({ title: "Updated", description: "Project documents updated!" });
      }
    });

    return () => {
      unsubscribeImage();
      unsubscribeContent();
      unsubscribeDocs();
    };
  }, [slug, toast]);

  const handleDownload = (docType) => {
    const doc = docs[docType];
    if (!doc) {
      toast({
        title: 'Not Available',
        description: `${docType === 'brochure' ? 'Brochure' : 'Site Plan'} not uploaded yet.`,
        variant: 'destructive'
      });
      return;
    }
    
    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download Started',
      description: `${docType === 'brochure' ? 'Brochure' : 'Site Plan'} is downloading...`,
    });
  };

  if (!loading && !project) {
    return <Navigate to="/projects" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[#0F3A5F] text-xl">Loading...</div>
      </div>
    );
  }

  const isPricingAvailable = pricing && pricing.length > 0;
  const hasDocuments = docs.brochure || docs.map;

  // Default amenities - Removed Power Backup, Community Hall, Club House
  const amenities = [
    { icon: Home, label: 'Gated Community', color: 'text-blue-600' },
    { icon: Shield, label: '24/7 Security', color: 'text-green-600' },
    { icon: Droplet, label: 'Water Supply', color: 'text-cyan-600' },
    { icon: Trees, label: 'Green Spaces', color: 'text-emerald-600' },
    { icon: Car, label: 'Wide Roads', color: 'text-gray-600' },
  ];

  // Location highlights
  const nearbyPlaces = [
    { icon: School, label: 'Schools', distance: '2-5 km', color: 'text-orange-600' },
    { icon: Heart, label: 'Hospitals', distance: '3-8 km', color: 'text-red-600' },
    { icon: ShoppingBag, label: 'Shopping', distance: '1-3 km', color: 'text-pink-600' },
    { icon: Train, label: 'Railway Station', distance: '5-10 km', color: 'text-blue-600' },
  ];

  // FAQs
  const faqs = [
    {
      q: 'What is the booking amount?',
      a: `The booking amount varies by plot size. Typically ${project.bookingPercentage || '10-35%'} of the total cost. Check the pricing table for exact amounts.`
    },
    {
      q: 'Is there an EMI facility?',
      a: 'Yes! We offer 0% interest EMI plans from 24 to 60 months depending on the project.'
    },
    {
      q: 'When will I get possession?',
      a: 'Immediate possession is available after full payment and registry completion.'
    },
    {
      q: 'Are there any hidden charges?',
      a: 'No hidden charges! Registry charges are extra as per government rates. Everything else is transparent.'
    },
    {
      q: 'Can I visit the site?',
      a: 'Absolutely! Book a free site visit and our team will arrange transportation and guided tour.'
    },
  ];

  // Filter investment benefits - Remove rental income opportunity
  const filteredBenefits = project.investmentBenefits?.filter(
    benefit => !benefit.toLowerCase().includes('rental income')
  ) || [];

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>{project.meta?.title || project.title}</title>
        <meta name="description" content={project.meta?.description || project.subline} />
      </Helmet>

      {/* Hero Section - Enhanced */}
      <section className="relative h-[85vh] w-full bg-gray-900 overflow-hidden">
        <img 
          key={project.heroImage}
          src={project.heroImage} 
          alt={project.title} 
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F3A5F] via-[#0F3A5F]/30 to-transparent" />
        
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <span className="inline-block px-5 py-2 mb-6 border-2 border-[#D4AF37] text-[#D4AF37] rounded-full text-sm font-bold tracking-wider uppercase bg-black/40 backdrop-blur-sm">
                ✨ Premium Residential Project
              </span>
              <h1 className="text-5xl md:text-7xl font-black text-white mb-5 leading-tight drop-shadow-lg">
                {project.title}
              </h1>
              <p className="text-2xl md:text-3xl text-gray-100 mb-4 font-light">
                {project.subline}
              </p>
              <div className="flex items-center text-white/90 mb-8 text-lg">
                <MapPin className="mr-2 text-[#D4AF37]" size={24} /> {project.location}
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <Button 
                  onClick={() => setModalOpen(true)}
                  size="lg"
                  className="h-16 px-10 bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] font-extrabold text-xl rounded-xl shadow-2xl hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all hover:scale-105"
                >
                  🏛️ Book Free Site Visit
                </Button>
                <a href={project.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="h-16 px-10 bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-xl rounded-xl shadow-2xl w-full md:w-auto">
                    <MessageCircle className="mr-2" size={24} /> WhatsApp Enquiry
                  </Button>
                </a>
              </div>

              {/* Download Buttons - Show from CMS */}
              {hasDocuments && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-3 mt-6"
                >
                  {docs.brochure && (
                    <Button 
                      onClick={() => handleDownload('brochure')}
                      className="h-12 px-6 bg-white/15 hover:bg-white/25 backdrop-blur-md border-2 border-white/40 text-white font-semibold rounded-lg shadow-lg transition-all hover:scale-105"
                    >
                      <FileText className="mr-2 w-5 h-5" /> Download Brochure
                    </Button>
                  )}
                  {docs.map && (
                    <Button 
                      onClick={() => handleDownload('map')}
                      className="h-12 px-6 bg-white/15 hover:bg-white/25 backdrop-blur-md border-2 border-white/40 text-white font-semibold rounded-lg shadow-lg transition-all hover:scale-105"
                    >
                      <Map className="mr-2 w-5 h-5" /> Download Site Plan
                    </Button>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Stats Banner */}
      <section className="bg-[#0F3A5F] py-8 text-white border-b-4 border-[#D4AF37]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <Calendar className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
              <p className="text-3xl font-black text-white mb-1">2012</p>
              <p className="text-xs uppercase tracking-widest text-blue-200">Established</p>
            </div>
            <div>
              <Building2 className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
              <p className="text-3xl font-black text-white mb-1">25+</p>
              <p className="text-xs uppercase tracking-widest text-blue-200">Projects</p>
            </div>
            <div>
              <Shield className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
              <p className="text-3xl font-black text-white mb-1">15,000+</p>
              <p className="text-xs uppercase tracking-widest text-blue-200">Happy Families</p>
            </div>
            <div>
              <Award className="w-10 h-10 text-[#D4AF37] mx-auto mb-2" />
              <p className="text-3xl font-black text-white mb-1">100%</p>
              <p className="text-xs uppercase tracking-widest text-blue-200">Legal Clarity</p>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section with Project Logo on Right */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-wider">About This Project</span>
              <h2 className="text-4xl font-black text-[#0F3A5F] mb-6 mt-2">
                Project Overview
              </h2>
              <div className="w-20 h-1.5 bg-[#D4AF37] mb-6 rounded-full"></div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6 whitespace-pre-line">
                {project.overview}
              </p>
              <div className="flex items-center text-[#0F3A5F] font-bold text-lg bg-blue-50 p-4 rounded-lg border-l-4 border-[#D4AF37]">
                <MapPin className="mr-3 text-[#D4AF37]" size={24} /> {project.location}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Project Logo Box */}
              {project.logo && (
                <div className="bg-white rounded-2xl shadow-xl border-2 border-[#D4AF37] p-6 text-center">
                  <img 
                    src={project.logo} 
                    alt={`${project.title} Logo`}
                    className="w-32 h-32 object-contain mx-auto mb-4"
                  />
                  <h3 className="text-xl font-black text-[#0F3A5F]">{project.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{project.location}</p>
                </div>
              )}

              {/* Why Choose Card */}
              <div className="bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] p-8 md:p-10 rounded-3xl shadow-2xl text-white">
                <h3 className="text-2xl font-black mb-6 flex items-center">
                  <span className="w-2 h-8 bg-[#D4AF37] mr-3 rounded-full"></span>
                  Why Choose {project.title.split(' ')[0]}?
                </h3>
                <ul className="space-y-4">
                  {project.keyHighlights?.map((highlight, idx) => (
                    <motion.li 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start group"
                    >
                      <div className="mt-1 mr-4 h-7 w-7 rounded-full bg-[#D4AF37] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Check size={16} className="text-[#0F3A5F] font-bold" />
                      </div>
                      <span className="text-white/95 font-medium text-base leading-relaxed">{highlight}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-wider">Modern Living</span>
            <h2 className="text-4xl font-black text-[#0F3A5F] mt-2 mb-4">World-Class Amenities</h2>
            <div className="w-20 h-1.5 bg-[#D4AF37] mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {amenities.map((amenity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 hover:border-[#D4AF37] hover:shadow-xl transition-all text-center group"
              >
                <div className="h-16 w-16 bg-gradient-to-br from-[#0F3A5F]/10 to-[#0F3A5F]/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <amenity.icon size={32} className={amenity.color} />
                </div>
                <p className="font-bold text-gray-800 text-sm">{amenity.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Connectivity */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-wider">Strategic Location</span>
            <h2 className="text-4xl font-black text-[#0F3A5F] mt-2 mb-4">Location & Connectivity</h2>
            <div className="w-20 h-1.5 bg-[#D4AF37] mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {nearbyPlaces.map((place, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all border-b-4 border-[#D4AF37]"
              >
                <div className="flex items-center justify-between mb-3">
                  <place.icon size={36} className={place.color} />
                  <span className="text-[#0F3A5F] font-black text-xl">{place.distance}</span>
                </div>
                <p className="font-bold text-gray-800 text-lg">{place.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6 text-lg">Prime connectivity to major landmarks and highways</p>
            <Button
              onClick={() => setModalOpen(true)}
              size="lg"
              className="bg-[#0F3A5F] hover:bg-[#0a2742] text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg"
            >
              <MapPin className="mr-2" /> Schedule Site Visit
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      {isPricingAvailable && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-wider">Investment Plans</span>
              <h2 className="text-4xl font-black text-[#0F3A5F] mt-2 mb-4">Plot Sizes & Rates</h2>
              <div className="w-20 h-1.5 bg-[#D4AF37] mx-auto rounded-full mb-4"></div>
              <p className="text-gray-600 text-lg">0% Interest EMI • No Hidden Charges • Instant Registry</p>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden rounded-2xl shadow-2xl bg-white border border-gray-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-[#0F3A5F] to-[#1a5a8f] text-white">
                    <th className="p-5 font-bold text-sm uppercase tracking-wider">Plot Size</th>
                    <th className="p-5 font-bold text-sm uppercase tracking-wider">Rate / Sq Yd</th>
                    <th className="p-5 font-bold text-sm uppercase tracking-wider">Total Cost</th>
                    <th className="p-5 font-bold text-sm uppercase tracking-wider bg-[#D4AF37] text-[#0F3A5F]">Booking Amount</th>
                    <th className="p-5 font-bold text-sm uppercase tracking-wider">Balance Amount</th>
                    <th className="p-5 font-bold text-sm uppercase tracking-wider">Monthly EMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pricing.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-5 font-black text-gray-900 text-lg">{row.size} Sq. Yd.</td>
                      <td className="p-5 text-gray-700 font-semibold">₹{row.rate?.toLocaleString()}</td>
                      <td className="p-5 font-black text-[#0F3A5F] text-lg">₹{row.total?.toLocaleString()}</td>
                      <td className="p-5 font-black text-[#D4AF37] text-lg bg-[#D4AF37]/10">₹{row.booking?.toLocaleString()}</td>
                      <td className="p-5 text-gray-700 font-semibold">₹{row.rest?.toLocaleString()}</td>
                      <td className="p-5 font-black text-[#0F3A5F] text-lg">₹{row.emi?.toLocaleString()}<span className="text-sm font-normal text-gray-500">/mo</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {pricing.map((row, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-xl p-5 border border-gray-200">
                  <div className="text-center mb-4 pb-4 border-b-2 border-[#D4AF37]">
                    <h3 className="text-2xl font-black text-[#0F3A5F]">{row.size} Sq. Yd.</h3>
                    <p className="text-sm text-gray-500 mt-1">₹{row.rate?.toLocaleString()} per sq yd</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Total Cost</span>
                      <span className="text-lg font-black text-[#0F3A5F]">₹{row.total?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline bg-[#D4AF37]/10 -mx-5 px-5 py-3 rounded">
                      <span className="text-xs text-gray-700 font-bold uppercase tracking-wide">Booking Amount</span>
                      <span className="text-lg font-black text-[#D4AF37]">₹{row.booking?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Balance Amount</span>
                      <span className="text-base font-bold text-gray-700">₹{row.rest?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Monthly EMI</span>
                      <span className="text-lg font-black text-[#0F3A5F]">₹{row.emi?.toLocaleString()}<span className="text-sm font-normal">/mo</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-400 mt-6">* Prices are indicative. Registry charges extra as per government rates.</p>
          </div>
        </section>
      )}

      {/* Investment Benefits */}
      {filteredBenefits.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-wider">Smart Investment</span>
              <h2 className="text-4xl font-black text-[#0F3A5F] mt-2 mb-4">Why Invest Here?</h2>
              <div className="w-20 h-1.5 bg-[#D4AF37] mx-auto rounded-full"></div>
            </div>

            <div className={`grid md:grid-cols-2 ${filteredBenefits.length > 2 ? 'lg:grid-cols-3' : ''} gap-6 max-w-4xl mx-auto`}>
              {filteredBenefits.map((benefit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-2xl hover:border-[#D4AF37] transition-all text-center group"
                >
                  <div className="h-14 w-14 bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp size={28} />
                  </div>
                  <p className="font-bold text-gray-800 text-base leading-snug">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-wider">Got Questions?</span>
            <h2 className="text-4xl font-black text-[#0F3A5F] mt-2 mb-4">Frequently Asked Questions</h2>
            <div className="w-20 h-1.5 bg-[#D4AF37] mx-auto rounded-full"></div>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden hover:border-[#D4AF37] transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-[#0F3A5F] text-lg pr-4">{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="text-[#D4AF37] flex-shrink-0" size={24} />
                  ) : (
                    <ChevronDown className="text-[#D4AF37] flex-shrink-0" size={24} />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-6 text-lg">Still have questions? We're here to help!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={project.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-[#25D366] hover:bg-[#1da851] text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg">
                  <MessageCircle className="mr-2" /> Chat on WhatsApp
                </Button>
              </a>
              <a href="tel:+918076146988">
                <Button size="lg" variant="outline" className="border-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white font-bold px-8 py-6 text-lg rounded-xl">
                  <Phone className="mr-2" /> Call Now
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-[#0F3A5F] via-[#1a5a8f] to-[#0F3A5F] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Ready to Own Your Dream Plot?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Book a free site visit today and explore {project.title} with our expert team
          </p>
          <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="h-16 px-12 bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] font-black text-xl rounded-xl shadow-2xl hover:scale-105 transition-all"
          >
            🏛️ Book Your Free Site Visit Now
          </Button>
        </div>
      </section>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t-2 border-[#D4AF37] md:hidden z-50 flex gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.15)]">
        <Button onClick={() => setModalOpen(true)} className="flex-1 bg-[#0F3A5F] text-white font-bold py-4 rounded-lg">
          🏛️ Book Visit
        </Button>
        <a href={project.whatsappUrl} className="flex-1">
          <Button className="w-full bg-[#25D366] text-white font-bold py-4 rounded-lg">
            <MessageCircle className="mr-1" size={18} /> WhatsApp
          </Button>
        </a>
      </div>

      <SiteVisitLeadModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        preSelectedProjectSlug={project.slug} 
      />
    </div>
  );
};

export default ProjectDetailPage;
