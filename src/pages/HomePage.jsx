import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, Shield, Calendar, Building, Users, 
  CheckCircle, Loader2, Phone, MapPin, Star, ArrowRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitSiteVisit } from '@/lib/storage';
import { useToast } from '@/components/ui/use-toast';
import EMICalculatorSection from '@/components/EMICalculatorSection';
import { useWhatsApp } from '@/lib/useWhatsApp';

// ─────────────────────────────────────────────────────────────────────────────
// Project data — RATES UPDATED Feb 2026
// Formula: startingPrice = rate × 100 sq yd
//          emi           = round((rate × 100 × 0.70) / 12)
// ─────────────────────────────────────────────────────────────────────────────
const projects = [
  {
    id: 'khatu-shyam-enclave',
    name: 'श्री खाटू श्याम Enclave',
    nameEn: 'Shri Khatu Shyam Enclave',
    logo: '/images/projects/khatu_shyam_enclave.png',
    location: 'Near Khatu Shyam Temple, Rajasthan',
    featured: true,
    highlight: true,
    tagline: 'Divine Living Near Sacred Temple',
    sizes: ['100', '150', '200', '250'],
    // rate ₹7,525 × 100 = ₹7,52,500
    startingPrice: '₹7.52 Lakhs',
    // (7,52,500 × 0.70) / 12 = ₹43,896
    emi: '₹43,896/month',
    amenities: ['Temple Proximity', 'Gated Security', 'Wide Roads', '24/7 Water'],
    status: 'Limited Plots Available',
    description: 'Experience spiritual living near the revered Khatu Shyam Temple'
  },
  {
    id: 'shree-kunj-bihari-enclave',
    name: 'श्री कुंज बिहारी Enclave',
    nameEn: 'Shree Kunj Bihari Enclave',
    logo: '/images/projects/shree_kunj_bihari_enclave.png',
    location: 'Vrindavan, UP',
    featured: true,
    highlight: true,
    tagline: 'Premium Plots in Krishna\'s Holy Land',
    sizes: ['100', '150', '200', '300'],
    // rate ₹7,525 × 100 = ₹7,52,500
    startingPrice: '₹7.52 Lakhs',
    // (7,52,500 × 0.70) / 12 = ₹43,896
    emi: '₹43,896/month',
    amenities: ['RERA Approved', 'Park', 'Street Lights', 'Underground Wiring'],
    status: 'Best Seller',
    description: 'Live in the divine aura of Vrindavan with modern amenities'
  },
  {
    id: 'gokul-vatika',
    name: 'गोकुल वाटिका',
    nameEn: 'Gokul Vatika',
    logo: '/images/projects/gokul_vatika.png',
    location: 'Mathura-Vrindavan Road',
    tagline: 'Serene Living Amidst Nature',
    sizes: ['100', '150', '200'],
    // rate ₹10,025 × 100 = ₹10,02,500
    startingPrice: '₹10.02 Lakhs',
    // (10,02,500 × 0.70) / 12 = ₹58,479
    emi: '₹58,479/month',
    amenities: ['Green Spaces', 'Community Hall', 'Children Park', 'Security'],
    status: 'Available'
  },
  {
    id: 'semri-vatika',
    name: 'सेमरी वाटिका',
    nameEn: 'Maa Semri Vatika',
    logo: '/images/projects/semri_vatika.png',
    location: 'Semri, Mathura',
    tagline: 'Premium Plots with High Appreciation',
    sizes: ['100', '125', '150', '200'],
    // rate ₹15,525 × 100 = ₹15,52,500
    startingPrice: '₹15.52 Lakhs',
    // (15,52,500 × 0.70) / 12 = ₹90,563
    emi: '₹90,563/month',
    amenities: ['Basic Infrastructure', 'Road Access', 'Electricity', 'Water Supply'],
    status: 'New Launch'
  },
  {
    id: 'jagannath-dham',
    name: 'जगन्नाथ धाम',
    nameEn: 'Jagannath Dham',
    logo: '/images/projects/jaganath_dham.png',
    location: 'Vrindavan Highway',
    tagline: 'Sacred Plots for Sacred Living',
    sizes: ['150', '200', '250'],
    // rate ₹8,025 × 100 = ₹8,02,500
    startingPrice: '₹8.02 Lakhs',
    // (8,02,500 × 0.70) / 12 = ₹46,813
    emi: '₹46,813/month',
    amenities: ['Temple View', 'Wide Plots', 'Paved Roads', 'Boundary Wall'],
    status: 'Available'
  },
  {
    id: 'brij-vatika',
    name: 'बृज वाटिका',
    nameEn: 'Brij Vatika (E Block)',
    logo: '/images/projects/brij_vatika.png',
    location: 'Braj Bhoomi, Vrindavan',
    tagline: 'Live in Lord Krishna\'s Land',
    sizes: ['100', '150', '200', '250', '300'],
    // rate ₹15,525 × 100 = ₹15,52,500
    startingPrice: '₹15.52 Lakhs',
    // (15,52,500 × 0.70) / 12 = ₹90,563
    emi: '₹90,563/month',
    amenities: ['Garden', 'Kids Play Area', 'Street Lights', 'Gated Entry'],
    status: 'Available'
  }
];

// Slider images data
const slides = [
  {
    id: 1,
    image: '/images/slides/team_culture.png',
    title: 'A Culture of Success',
    subtitle: 'Celebrating Excellence & Partnership',
    description: 'Fanbe\'s Business Meets and Gold Achiever ceremonies'
  },
  {
    id: 2,
    image: '/images/slides/trust_transparency.png',
    title: 'पारदर्शिता और विश्वास',
    subtitle: 'Transparency & Trust',
    points: [
      'तुरंत रजिस्ट्री: पूरा पैसा देने पर तुरंत रजिस्ट्री',
      'पारदर्शी प्रक्रिया: कोई छिपा हुआ शुल्क (Hidden Charges) नहीं',
      'कागजी कार्यवाही: आसान और सुरक्षित डॉक्यूमेंटेशन'
    ]
  },
  {
    id: 3,
    image: '/images/slides/amenities.png',
    title: 'सुविधाएं जो जीवन को आसान बनाएं',
    subtitle: 'Modern Amenities',
    points: [
      'भव्य प्रवेश द्वार: सुरक्षा गार्ड के साथ',
      'पक्की सड़कें: कॉलोनी के अंदर चौड़ी सड़कें',
      'हरा-भरा वातावरण: प्रदूषण मुक्त और ताज़ी हवा',
      'बिजली और पानी: बुनियादी ढांचे की पूरी व्यवस्था'
    ]
  }
];

const HomePage = ({ onBookSiteVisit }) => {
  const { toast } = useToast();
  const { getWhatsAppLink } = useWhatsApp();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    if (!leadForm.name || !leadForm.phone) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSiteVisit({
        name: leadForm.name,
        phone: leadForm.phone,
        project: 'Homepage Inquiry',
        date: new Date().toISOString()
      });
      toast({ title: "Success!", description: "We'll contact you soon" });
      setLeadForm({ name: '', phone: '' });
    } catch (error) {
      toast({ title: "Error", description: "Please try again", variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  const featuredProjects = projects.filter(p => p.highlight);
  const regularProjects = projects.filter(p => !p.highlight);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Fanbe Group - Premium Plotted Developments in Vrindavan & Mathura</title>
        <meta name="description" content="Discover spiritual living with Fanbe Group's premium plots in Vrindavan, Mathura, and Braj Bhoomi. RERA approved, transparent pricing, easy EMI." />
      </Helmet>

      {/* Hero Slider Section */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f]">
        {/* Slides */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Slide Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F3A5F]/95 to-[#0F3A5F]/70" />
            
            {/* Slide Content - CENTER ALIGNED */}
            <div className="relative h-full container mx-auto px-4 flex items-center justify-center">
              <div className="w-full max-w-4xl text-white text-center">
                {/* Elegant Fanbe Group Branding - Centered */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6 md:mb-8"
                >
                  <div className="flex items-center justify-center gap-3 md:gap-4 mb-4">
                    {/* Building Icon Circle */}
                    <div className="w-14 h-14 md:w-20 md:h-20 bg-[#D4AF37] rounded-full flex items-center justify-center flex-shrink-0 shadow-2xl">
                      <Building className="w-7 h-7 md:w-10 md:h-10 text-[#0F3A5F]" />
                    </div>
                  </div>
                  {/* Fanbe Group Text - Elegant & Centered */}
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-wide leading-tight mb-2">
                    <span className="text-[#D4AF37]">Fanbe</span> <span className="text-white">Group</span>
                  </h1>
                  {/* Since 2012 - Subtle, smaller */}
                  <p className="text-sm md:text-base text-gray-300 font-light">Since 2012</p>
                </motion.div>

                {/* Slide Title */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4"
                >
                  {slides[currentSlide].title}
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg md:text-xl lg:text-2xl text-[#D4AF37] mb-4 md:mb-6"
                >
                  {slides[currentSlide].subtitle}
                </motion.p>

                {/* Slide Points */}
                {slides[currentSlide].points && (
                  <motion.ul
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-left max-w-2xl mx-auto"
                  >
                    {slides[currentSlide].points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 md:gap-3">
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37] flex-shrink-0 mt-0.5 md:mt-1" />
                        <span className="text-sm md:text-lg leading-tight text-left">{point}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}

                {slides[currentSlide].description && (
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-base md:text-xl mb-6 md:mb-8"
                  >
                    {slides[currentSlide].description}
                  </motion.p>
                )}

                {/* CTAs - Centered */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center"
                >
                  <Link to="/projects">
                    <Button size="lg" className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#B8941E] text-black font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-xl">
                      Explore Projects
                      <ChevronRight className="ml-2" />
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-[#0F3A5F] text-base md:text-lg px-6 md:px-8 py-5 md:py-6"
                    onClick={() => window.open('https://wa.me/918076146988', '_blank')}
                  >
                    <Phone className="mr-2" />
                    Contact Us
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slider Controls */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-all z-10"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-all z-10"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Slider Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white relative z-20 -mt-10 rounded-t-[3rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Calendar, label: 'Founded', value: '2012' },
              { icon: Building, label: 'Projects', value: '6+' },
              { icon: Users, label: 'Happy Families', value: '5,000+' },
              { icon: Shield, label: 'Legal Clarity', value: '100%' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] p-6 rounded-xl text-white text-center hover:scale-105 transition-transform shadow-lg"
              >
                <stat.icon className="h-10 w-10 mx-auto mb-3 text-[#D4AF37]" />
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects - Khatu Shyam & Kunj Bihari */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-2 bg-[#D4AF37]/20 text-[#0F3A5F] rounded-full font-bold mb-4">
                ⭐ Featured Projects
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-[#0F3A5F] mb-4">
                Premium Spiritual Living
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Experience divine living in our flagship projects
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {featuredProjects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all"
              >
                {/* Best Seller Badge */}
                {project.status && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="bg-gradient-to-r from-[#D4AF37] to-[#B8941E] text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      {project.status}
                    </span>
                  </div>
                )}

                {/* Project Logo */}
                <div className="bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] p-8 flex items-center justify-center min-h-[280px]">
                  <img 
                    src={project.logo} 
                    alt={project.nameEn}
                    className="max-w-full max-h-[250px] object-contain drop-shadow-2xl group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Project Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-[#0F3A5F] mb-1">{project.nameEn}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {project.location}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 italic">"{project.tagline}"</p>

                  {/* Pricing */}
                  <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Starting From</p>
                      <p className="text-2xl font-bold text-[#0F3A5F]">{project.startingPrice}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">EMI From</p>
                      <p className="text-lg font-bold text-[#D4AF37]">{project.emi}</p>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Key Features:</p>
                    <div className="flex flex-wrap gap-2">
                      {project.amenities.slice(0, 4).map((amenity, i) => (
                        <span key={i} className="px-3 py-1 bg-[#D4AF37]/10 text-[#0F3A5F] text-xs rounded-full">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTAs */}
                  <div className="flex gap-3">
                    <Link to={`/projects/${project.id}`} className="flex-1">
                      <Button className="w-full bg-[#0F3A5F] hover:bg-[#0a2742]">
                        View Details
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline"
                      className="border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white"
                      onClick={() => window.open('https://wa.me/918076146988', '_blank')}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Projects Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold text-[#0F3A5F] mb-4">
                All Our Projects
              </h2>
              <p className="text-xl text-gray-600">
                Explore premium plotted developments across sacred locations
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, idx) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
              >
                {/* Logo Container */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center min-h-[200px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0F3A5F]/5 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img 
                    src={project.logo} 
                    alt={project.nameEn}
                    className="max-w-full max-h-[180px] object-contain drop-shadow-lg group-hover:scale-110 transition-transform relative z-10"
                  />
                  {project.highlight && (
                    <div className="absolute top-2 right-2">
                      <Star className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#0F3A5F] mb-2">{project.nameEn}</h3>
                  <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {project.location}
                  </p>

                  <div className="flex items-center justify-between mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">From </span>
                      <span className="font-bold text-[#0F3A5F]">{project.startingPrice}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">EMI </span>
                      <span className="font-semibold text-[#D4AF37]">{project.emi}</span>
                    </div>
                  </div>

                  <Link to={`/projects/${project.id}`}>
                    <Button className="w-full bg-[#0F3A5F] hover:bg-[#0a2742]">
                      View Details
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EMI Calculator */}
      <div className="bg-gray-50">
        <EMICalculatorSection />
      </div>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Ready to Invest in Your Dream Plot?</h2>
            <p className="text-xl mb-8 text-gray-200">
              Schedule a site visit or talk to our property experts today
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-[#D4AF37] hover:bg-[#B8941E] text-black font-bold text-lg px-8"
                onClick={() => onBookSiteVisit?.()}
              >
                <Calendar className="mr-2" />
                Book Site Visit
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-[#0F3A5F] text-lg px-8"
                onClick={() => window.open('tel:+918076146988')}
              >
                <Phone className="mr-2" />
                Call Us Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
