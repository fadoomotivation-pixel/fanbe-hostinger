
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Shield, Calendar, Building, Users, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitSiteVisit } from '@/lib/storage';
import { useToast } from '@/components/ui/use-toast';
import EMICalculatorSection from '@/components/EMICalculatorSection';
import ProjectsShowcase from '@/components/ProjectsShowcase';
import { useWhatsApp } from '@/lib/useWhatsApp';

// Default values as fallbacks
const defaults = {
  hero: {
    heading: "Building Trust. Creating Value. Shaping Tomorrow.",
    subheading: "Experience the pinnacle of residential living with Fanbe Group. Where integrity meets excellence.",
    ctaText: "Explore Projects",
    bgImage: "https://images.unsplash.com/photo-1679931676577-b79a86e99bb7",
    overlayColor: "rgba(15, 58, 95, 0.8)"
  },
  stats: {
    foundedLabel: "Founded",
    foundedValue: "2012",
    projectsLabel: "Projects Delivered",
    projectsValue: "50+",
    customersLabel: "Happy Customers",
    customersValue: "15,000+",
    legalLabel: "Legal Clarity",
    legalDesc: "100% Legal Clarity"
  },
  projects: {
    heading: "Our Projects",
    description: "Explore our premium plotted developments designed for your spiritual and peaceful living.",
    sqYardLabel: "Sq Yard",
    bookingLabel: "Booking Amount",
    emiLabel: "EMI",
    ctaText: "View Details"
  },
  featured: {
    heading: "Shree Kunj Bihari Enclave",
    description: "Our flagship project offering premium residential plots with modern amenities in the heart of the holy city.",
    image: "https://images.unsplash.com/photo-1600596542815-e328701102b9",
    whatsapp: "8076146988",
    whatsappBtnText: "Enquire Now",
    ctaText: "View Details"
  },
  team: {
    enabled: false,
    members: []
  },
  general: {
    title: "Fanbe Developer | Since 2012",
    tagline: "Since 2012",
    primaryColor: "#0F3A5F",
    secondaryColor: "#D4AF37",
    accentColor: "#25D366"
  }
};

const HomePage = ({ onBookSiteVisit }) => {
  const { toast } = useToast();
  const { getWhatsAppLink } = useWhatsApp();
  
  const [content, setContent] = useState(defaults);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load content from localStorage and listen for updates
  useEffect(() => {
    const loadContent = () => {
      const get = (key, def) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : def;
      };

      setContent({
        hero: get('homepage_hero_settings', defaults.hero),
        stats: get('homepage_stats_settings', defaults.stats),
        projects: get('homepage_projects_settings', defaults.projects),
        featured: get('homepage_featured_project_settings', defaults.featured),
        team: get('homepage_team_settings', defaults.team),
        general: get('homepage_general_settings', defaults.general)
      });
    };

    loadContent();

    // Listen for custom event dispatch or standard storage event
    const handleStorageUpdate = () => loadContent();
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('homepage_content_updated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('homepage_content_updated', handleStorageUpdate);
    };
  }, []);

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) {
      toast({ title: "Required", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitSiteVisit({ ...leadForm, preferred_project: 'General Inquiry' });
      toast({ title: "Success!", description: "We will contact you within 24 hours." });
      setLeadForm({ name: '', phone: '' });
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const statsItems = [
    { icon: Calendar, value: content.stats.foundedValue, label: content.stats.foundedLabel },
    { icon: Building, value: content.stats.projectsValue, label: content.stats.projectsLabel },
    { icon: Users, value: content.stats.customersValue, label: content.stats.customersLabel },
    { icon: Shield, value: content.stats.legalDesc, label: content.stats.legalLabel }
  ];

  const features = [
    { title: "Clear Title & Support", desc: "Complete transparency with registry assistance." },
    { title: "Strategic Locations", desc: "Prime areas with high growth potential." },
    { title: "Planned Developments", desc: "Gated communities with modern amenities." },
    { title: "Investor-Friendly", desc: "Flexible payment plans to suit your needs." }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-[#F5F5F5]"
    >
      <Helmet>
        <title>{content.general.title}</title>
        <meta name="description" content={`Fanbe Developer - ${content.general.tagline}. Premier real estate developers since 2012.`} />
        <style>{`
          :root {
            --primary-color: ${content.general.primaryColor};
            --secondary-color: ${content.general.secondaryColor};
            --accent-color: ${content.general.accentColor};
          }
        `}</style>
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 transition-opacity duration-1000">
          <img
            src={content.hero.bgImage}
            alt="Hero Background"
            className="w-full h-full object-cover transition-all duration-1000"
            key={content.hero.bgImage}
          />
          <div className="absolute inset-0" style={{backgroundColor: content.hero.overlayColor}} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-4 pt-20">
          <motion.div 
            {...fadeInUp}
            className="max-w-4xl mx-auto text-center text-white"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight whitespace-pre-line">
              {content.hero.heading}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 font-light max-w-2xl mx-auto">
              {content.hero.subheading}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/projects">
                <Button 
                  style={{ backgroundColor: content.general.secondaryColor, color: content.general.primaryColor }}
                  className="w-full sm:w-auto px-8 py-6 text-lg font-bold rounded-lg shadow-lg hover:scale-105 transition-all border-none hover:opacity-90"
                >
                  {content.hero.ctaText}
                </Button>
              </Link>
              <Button 
                onClick={onBookSiteVisit}
                variant="outline" 
                className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-[#0F3A5F] px-8 py-6 text-lg font-bold rounded-lg transition-all"
              >
                Book Site Visit
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white relative z-20 -mt-10 rounded-t-[3rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsItems.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#2C2C2C] p-8 rounded-xl text-white text-center hover:bg-[#0F3A5F] transition-colors duration-300 group cursor-default shadow-lg hover:shadow-xl"
              >
                <stat.icon 
                  className="h-10 w-10 mx-auto mb-4 transition-transform group-hover:scale-110" 
                  style={{ color: content.general.secondaryColor }} 
                />
                <div className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{stat.value}</div>
                <div className="text-gray-400 font-medium group-hover:text-gray-200">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section - Passing content props to Showcase or rendering manually */}
      <div className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 mb-12 text-center">
             <h2 className="text-4xl font-bold mb-4" style={{color: content.general.primaryColor}}>{content.projects.heading}</h2>
             <p className="text-xl text-gray-600 max-w-2xl mx-auto">{content.projects.description}</p>
        </div>
        <ProjectsShowcase 
           labels={{
              sqYard: content.projects.sqYardLabel,
              booking: content.projects.bookingLabel,
              emi: content.projects.emiLabel,
              cta: content.projects.ctaText
           }}
           primaryColor={content.general.primaryColor}
           secondaryColor={content.general.secondaryColor}
        />
      </div>

      {/* Featured Project Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
             <div className="lg:w-1/2">
                <span className="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4 bg-yellow-100 text-yellow-800">Featured Project</span>
                <h2 className="text-4xl font-bold mb-6" style={{color: content.general.primaryColor}}>{content.featured.heading}</h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                   {content.featured.description}
                </p>
                <div className="flex flex-wrap gap-4">
                   <Link to="/projects/shree-kunj-bihari-enclave">
                      <Button style={{backgroundColor: content.general.primaryColor}} className="px-8 py-6 text-lg">
                         {content.featured.ctaText}
                      </Button>
                   </Link>
                   <Button 
                      variant="outline" 
                      className="px-8 py-6 text-lg border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                      onClick={() => window.open(`https://wa.me/91${content.featured.whatsapp}`, '_blank')}
                   >
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6 mr-2" alt="WA" />
                      {content.featured.whatsappBtnText}
                   </Button>
                </div>
             </div>
             <div className="lg:w-1/2 relative">
                <div className="absolute -inset-4 bg-gray-100 rounded-2xl transform rotate-3 -z-10"></div>
                <img src={content.featured.image} alt={content.featured.heading} className="rounded-xl shadow-2xl w-full object-cover h-[400px]" />
             </div>
          </div>
        </div>
      </section>

      {/* Team Section (Conditional) */}
      {content.team.enabled && (
        <section className="py-20 bg-gray-50">
           <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-12" style={{color: content.general.primaryColor}}>Our Leadership Team</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                 {content.team.members.map((member, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
                       <img 
                          src={member.image} 
                          alt={member.name} 
                          className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4"
                          style={{borderColor: content.general.secondaryColor}}
                       />
                       <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                       <p className="text-[#0F3A5F] font-medium mb-3">{member.position}</p>
                       <p className="text-sm text-gray-500">{member.bio}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-6" style={{color: content.general.primaryColor}}>About Fanbe Group</h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Founded in {content.stats.foundedValue}, Fanbe Group has established itself as a beacon of trust in the real estate sector. 
                  With a steadfast commitment to transparency and quality, we have successfully delivered over {content.stats.projectsValue} projects, 
                  bringing joy to more than {content.stats.customersValue} families. We don't just sell plots; we build foundations for your future.
                </p>
                <Link to="/about">
                  <Button variant="outline" className="text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white transition-colors">
                    Learn More About Us
                  </Button>
                </Link>
              </motion.div>

              <div className="grid sm:grid-cols-2 gap-6">
                {features.map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-6 rounded-xl bg-gray-50 border border-gray-100 hover:bg-[#0F3A5F] hover:text-white transition-all duration-300 group shadow-sm hover:shadow-lg hover:-translate-y-1"
                  >
                    <CheckCircle className="h-8 w-8 text-[#0F3A5F] group-hover:text-[#D4AF37] mb-4 transition-colors" />
                    <h3 className="font-bold text-lg mb-2 text-[#2C2C2C] group-hover:text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-600 group-hover:text-gray-300">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

      {/* Lead Capture */}
      <section className="py-20 text-white" style={{backgroundColor: content.general.primaryColor}}>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Speak With Our Investment Advisor</h2>
            <p className="text-xl text-gray-300 mb-8 font-light">Get personalized guidance on your real estate investment.</p>
            
            <form onSubmit={handleLeadSubmit} className="max-w-lg mx-auto bg-white/5 p-8 rounded-2xl backdrop-blur-sm border border-white/10">
              <div className="space-y-4 mb-6">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                  disabled={isSubmitting}
                />
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>
              <Button 
                type="submit" 
                style={{backgroundColor: content.general.secondaryColor, color: content.general.primaryColor}}
                className="w-full font-bold py-3 text-lg hover:opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Schedule Consultation"}
              </Button>
              <p className="text-xs text-gray-400 mt-4">No spam. Genuine assistance. Response within 24 hours.</p>
            </form>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default HomePage;
