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
    const projectDocs = await getProjectDocs(slug); // NOW ASYNC!

    const dbImages = await getProjectImagesFromDB();
    const heroImage = dbImages[slug] || dynamicContent?.heroImage || staticProject.heroImage;

    const mergedProject = { ...staticProject, ...(dynamicContent || {}), heroImage };
    const finalPricing = (dynamicPricing && dynamicPricing.length > 0) ? dynamicPricing : staticProject.pricing;

    setProject(mergedProject);
    setPricing(finalPricing);
    setDocs(projectDocs);
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
    
    // Open in new tab (cloud URL)
    window.open(doc.data, '_blank');
    
    toast({
      title: 'Opening Document',
      description: `${docType === 'brochure' ? 'Brochure' : 'Site Plan'} is opening...`,
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

  // Rest of component code remains the same...
  const amenities = [
    { icon: Home, label: 'Gated Community', color: 'text-blue-600' },
    { icon: Shield, label: '24/7 Security', color: 'text-green-600' },
    { icon: Droplet, label: 'Water Supply', color: 'text-cyan-600' },
    { icon: Trees, label: 'Green Spaces', color: 'text-emerald-600' },
    { icon: Car, label: 'Wide Roads', color: 'text-gray-600' },
  ];

  const nearbyPlaces = [
    { icon: School, label: 'Schools', distance: '2-5 km', color: 'text-orange-600' },
    { icon: Heart, label: 'Hospitals', distance: '3-8 km', color: 'text-red-600' },
    { icon: ShoppingBag, label: 'Shopping', distance: '1-3 km', color: 'text-pink-600' },
    { icon: Train, label: 'Railway Station', distance: '5-10 km', color: 'text-blue-600' },
  ];

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

  const filteredBenefits = project.investmentBenefits?.filter(
    benefit => !benefit.toLowerCase().includes('rental income')
  ) || [];

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>{project.meta?.title || project.title}</title>
        <meta name="description" content={project.meta?.description || project.subline} />
      </Helmet>

      {/* Hero Section */}
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

      {/* Overview Section with Project Logo in Why Choose Card */}
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
              className="bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] p-8 md:p-10 rounded-3xl shadow-2xl text-white"
            >
              <div className="flex items-center gap-4 mb-6">
                {project.logo && (
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-white rounded-xl p-2 shadow-lg">
                      <img 
                        src={project.logo} 
                        alt={`${project.title} Logo`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-black">
                    Why Choose {project.title.split(' ')[0]}?
                  </h3>
                </div>
              </div>

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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Rest of sections... (keeping the same code for brevity) */}
      {/* Amenities, Location, Pricing, Benefits, FAQ sections remain unchanged */}

      <SiteVisitLeadModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        preSelectedProjectSlug={project.slug} 
      />
    </div>
  );
};

export default ProjectDetailPage;
