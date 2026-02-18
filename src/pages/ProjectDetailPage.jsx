import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { projectsData } from '@/data/projectsData';
import { Button } from '@/components/ui/button';
import { Check, MapPin, MessageCircle, TrendingUp } from 'lucide-react';
import { getProjectContent, getPricingTable } from '@/lib/contentStorage';
import { subscribeToContentUpdates, EVENTS } from '@/lib/contentSyncService';
import SiteVisitLeadModal from '@/components/SiteVisitLeadModal';
import { useToast } from '@/components/ui/use-toast';

const ProjectDetailPage = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [pricing, setPricing] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    const staticProject = projectsData.find(p => p.slug === slug);
    if (!staticProject) {
      setLoading(false);
      return;
    }

    const dynamicContent = getProjectContent(slug);
    const dynamicPricing = getPricingTable(slug);
    const mergedProject = dynamicContent ? { ...staticProject, ...dynamicContent } : staticProject;
    const finalPricing = (dynamicPricing && dynamicPricing.length > 0) ? dynamicPricing : staticProject.pricing;

    setProject(mergedProject);
    setPricing(finalPricing);
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const unsubscribeImage = subscribeToContentUpdates(EVENTS.PROJECT_IMAGE_UPDATED, (data) => {
      if (!data.data.slug || data.data.slug === slug) {
        loadData();
        toast({ title: "Updated", description: "Project image updated in real-time!" });
      }
    });

    const unsubscribeContent = subscribeToContentUpdates(EVENTS.PROJECT_CONTENT_UPDATED, (data) => {
      if (!data.data.slug || data.data.slug === slug) {
        loadData();
        toast({ title: "Updated", description: "Project content updated in real-time!" });
      }
    });

    return () => {
      unsubscribeImage();
      unsubscribeContent();
    };

  }, [slug, toast]);

  if (!loading && !project) {
    return <Navigate to="/projects" replace />;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const isPricingAvailable = pricing && pricing.length > 0;

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        <title>{project.meta?.title || project.title}</title>
        <meta name="description" content={project.meta?.description || project.subline} />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-[80vh] w-full bg-gray-900 overflow-hidden">
        <img 
          key={project.heroImage}
          src={project.heroImage} 
          alt={project.title} 
          className="w-full h-full object-cover opacity-60 transition-opacity duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F3A5F] via-transparent to-transparent opacity-90" />
        
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <span className="inline-block px-4 py-1 mb-6 border border-[#D4AF37] text-[#D4AF37] rounded-full text-sm font-semibold tracking-wider uppercase bg-black/30 backdrop-blur-sm">
                Premium Residential Project
              </span>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
                {project.title}
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8 font-light">
                {project.subline}
              </p>
              
              <div className="flex flex-col md:flex-row gap-4">
                <Button 
                  onClick={() => setModalOpen(true)}
                  className="h-14 px-8 bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] font-bold text-lg rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Book Site Visit
                </Button>
                <a href={project.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="h-14 px-8 bg-[#0F3A5F] hover:bg-[#0a2742] text-white font-bold text-lg rounded-lg shadow-lg w-full md:w-auto">
                    <MessageCircle className="mr-2" /> Enquiry
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#0F3A5F] mb-6 relative inline-block">
                Project Overview
                <span className="absolute bottom-0 left-0 w-1/2 h-1 bg-[#D4AF37]"></span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6 whitespace-pre-line">
                {project.overview}
              </p>
              <div className="flex items-center text-[#0F3A5F] font-semibold">
                <MapPin className="mr-2" /> {project.location}
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl shadow-inner border border-gray-100">
              <h3 className="text-xl font-bold text-[#0F3A5F] mb-6">Why Choose {project.title}?</h3>
              <ul className="space-y-4">
                {project.keyHighlights?.map((highlight, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="mt-1 mr-3 h-5 w-5 rounded-full bg-[#D4AF37] flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-[#0F3A5F] font-bold" />
                    </div>
                    <span className="text-gray-700 font-medium">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      {isPricingAvailable && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-[#0F3A5F] mb-12">Pricing & Payment Plans</h2>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-xl shadow-xl bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0F3A5F] text-white">
                    <th className="p-4 font-semibold text-sm uppercase tracking-wider">Plot Size</th>
                    <th className="p-4 font-semibold text-sm uppercase tracking-wider">Rate / Sq Yd</th>
                    <th className="p-4 font-semibold text-sm uppercase tracking-wider">Total Cost</th>
                    <th className="p-4 font-semibold text-sm uppercase tracking-wider bg-[#D4AF37] text-[#0F3A5F]">Booking Amt</th>
                    <th className="p-4 font-semibold text-sm uppercase tracking-wider">Rest Amt</th>
                    <th className="p-4 font-semibold text-sm uppercase tracking-wider">Monthly EMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pricing.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#0F3A5F]/5 transition-colors">
                      <td className="p-4 font-bold text-gray-800">{row.size} Sq. Yd.</td>
                      <td className="p-4 text-gray-600">₹{row.rate?.toLocaleString()}</td>
                      <td className="p-4 font-bold text-[#0F3A5F]">₹{row.total?.toLocaleString()}</td>
                      <td className="p-4 font-bold text-[#D4AF37] bg-[#D4AF37]/10">₹{row.booking?.toLocaleString()}</td>
                      <td className="p-4 text-gray-600">₹{row.rest?.toLocaleString()}</td>
                      <td className="p-4 font-bold text-[#0F3A5F]">₹{row.emi?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {pricing.map((row, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-lg p-4">
                  <div className="text-center mb-3 pb-3 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-[#0F3A5F]">{row.size} Sq. Yd.</h3>
                    <p className="text-sm text-gray-500">₹{row.rate?.toLocaleString()} per sq yd</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-500">Total Cost</span>
                      <span className="text-base font-bold text-[#0F3A5F]">₹{row.total?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline bg-[#D4AF37]/10 -mx-4 px-4 py-2 rounded">
                      <span className="text-xs text-gray-600 font-medium">Booking Amount</span>
                      <span className="text-base font-bold text-[#D4AF37]">₹{row.booking?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-500">Rest Amount</span>
                      <span className="text-sm font-semibold text-gray-700">₹{row.rest?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-500">Monthly EMI</span>
                      <span className="text-base font-bold text-[#0F3A5F]">₹{row.emi?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-400 mt-4">* Prices are subject to change. Registry charges extra as applicable.</p>
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#0F3A5F] mb-12">Investment Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {project.investmentBenefits?.map((benefit, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow text-center">
                <div className="h-12 w-12 bg-[#0F3A5F]/10 text-[#0F3A5F] rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={24} />
                </div>
                <p className="font-medium text-gray-800">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="bg-[#0F3A5F] py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-around items-center gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-[#D4AF37] mb-1">2012</p>
              <p className="text-sm uppercase tracking-widest text-blue-200">Founded In</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-[#D4AF37] mb-1">20+</p>
              <p className="text-sm uppercase tracking-widest text-blue-200">Projects Delivered</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-[#D4AF37] mb-1">15,000+</p>
              <p className="text-sm uppercase tracking-widest text-blue-200">Happy Families</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Bottom CTA for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:hidden z-40 flex gap-4 shadow-[0_-5px_10px_rgba(0,0,0,0.1)]">
        <Button onClick={() => setModalOpen(true)} className="flex-1 bg-[#0F3A5F] text-white">
          Book Visit
        </Button>
        <a href={project.whatsappUrl} className="flex-1">
          <Button variant="outline" className="w-full border-[#0F3A5F] text-[#0F3A5F]">
            Enquiry
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