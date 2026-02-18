import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, Shield, Calendar, Building, Users, 
  CheckCircle, Phone, MapPin, Star, ArrowRight, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitSiteVisit } from '@/lib/storage';
import { useToast } from '@/components/ui/use-toast';
import EMICalculatorSection from '@/components/EMICalculatorSection';
import { useWhatsApp } from '@/lib/useWhatsApp';

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
    sizes: ['50', '100', '150', '200', '250'],
    startingPrice: '₹3.76 Lakhs',
    bookingAmt: '₹37,625 (10%)',
    emi: '₹5,644/month',
    emiMonths: 60,
    bookingPct: '10%',
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
    sizes: ['50', '100', '150', '200', '300'],
    startingPrice: '₹3.76 Lakhs',
    bookingAmt: '₹37,625 (10%)',
    emi: '₹5,644/month',
    emiMonths: 60,
    bookingPct: '10%',
    amenities: ['Premium Gated Layout', 'Park', 'Street Lights', 'Underground Wiring'],
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
    sizes: ['50', '100', '150', '200'],
    startingPrice: '₹5.01 Lakhs',
    bookingAmt: '₹1,75,438 (35%)',
    emi: '₹13,576/month',
    emiMonths: 24,
    bookingPct: '35%',
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
    sizes: ['50', '100', '125', '150', '200'],
    startingPrice: '₹7.76 Lakhs',
    bookingAmt: '₹2,71,688 (35%)',
    emi: '₹21,024/month',
    emiMonths: 24,
    bookingPct: '35%',
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
    sizes: ['50', '100', '150', '200', '250'],
    startingPrice: '₹4.01 Lakhs',
    bookingAmt: '₹50,156 (12.5%)',
    emi: '₹6,502/month',
    emiMonths: 54,
    bookingPct: '12.5%',
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
    sizes: ['50', '100', '150', '200', '250', '300'],
    startingPrice: '₹7.76 Lakhs',
    bookingAmt: '₹2,71,688 (35%)',
    emi: '₹12,615/month',
    emiMonths: 40,
    bookingPct: '35%',
    amenities: ['Garden', 'Kids Play Area', 'Street Lights', 'Gated Entry'],
    status: 'Available'
  }
];

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
      'कागजी कार्यवाही: आसान और सुरक्षित डॉक्युमेंटेशन'
    ]
  },
  {
    id: 3,
    image: '/images/slides/amenities.png',
    title: 'सुविधाएं जो जीवन को आसान बनाएं',
    subtitle: 'Modern Amenities',
    points: [
      'भव्य प्रवेश द्वार: सुरक्षा गार्ड के साथ',
      'पक्की सड़केंः कॉलोनी के अंदर चौड़ी सड़केें',
      'हरा-भरा वातावरण: प्रदूषण मुक्त और ताज़ी हवा',
      'बिजली और पानी: बुनियादी ढांचे की पूरी व्यवस्था'
    ]
  }
];

// Plot sizes for "Plan Your Dream Plot" section
const plotSizes = [50, 75, 100, 125, 150, 175, 200];

const HomePage = ({ onBookSiteVisit }) => {
  const { toast } = useToast();
  const { getWhatsAppLink } = useWhatsApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [leadForm, setLeadForm] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitSiteVisit({ name: leadForm.name, phone: leadForm.phone, project: 'Homepage Inquiry', date: new Date().toISOString() });
      toast({ title: 'Success!', description: "We'll contact you soon" });
      setLeadForm({ name: '', phone: '' });
    } catch (error) {
      toast({ title: 'Error', description: 'Please try again', variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Fanbe Group - Premium Plotted Developments in Vrindavan & Mathura</title>
        <meta name="description" content="Discover spiritual living with Fanbe Group's premium plots in Vrindavan, Mathura, and Braj Bhoomi. RERA approved, transparent pricing, easy EMI." />
      </Helmet>

      {/* Hero Slider */}
      <section className="relative h-[600px] md:h-[700px] overflow-hidden bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f]">
        <AnimatePresence mode="wait">
          <motion.div key={currentSlide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F3A5F]/95 to-[#0F3A5F]/70" />
            <div className="relative h-full container mx-auto px-4 flex items-center justify-center">
              <div className="w-full max-w-4xl text-white text-center">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="mb-6 md:mb-8">
                  <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-wide leading-tight mb-2">
                    <span className="text-[#D4AF37]">Fanbe</span> <span className="text-white">Group</span>
                  </h1>
                </motion.div>
                <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
                  {slides[currentSlide].title}
                </motion.h2>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="text-lg md:text-xl lg:text-2xl text-[#D4AF37] mb-4 md:mb-6">
                  {slides[currentSlide].subtitle}
                </motion.p>
                {slides[currentSlide].points && (
                  <motion.ul initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-2 md:space-y-3 mb-6 md:mb-8 text-left max-w-2xl mx-auto">
                    {slides[currentSlide].points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 md:gap-3">
                        <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37] flex-shrink-0 mt-0.5 md:mt-1" />
                        <span className="text-sm md:text-lg leading-tight text-left">{point}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
                {slides[currentSlide].description && (
                  <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="text-base md:text-xl mb-6 md:mb-8">
                    {slides[currentSlide].description}
                  </motion.p>
                )}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }} className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                  <Link to="/projects">
                    <Button size="lg" className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#B8941E] text-black font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-xl">
                      Explore Projects <ChevronRight className="ml-2" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-[#0F3A5F] text-base md:text-lg px-6 md:px-8 py-5 md:py-6" onClick={() => window.open('https://wa.me/918076146988', '_blank')}>
                    <Phone className="mr-2" /> Contact Us
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-all z-10"><ChevronLeft className="w-6 h-6 text-white" /></button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full backdrop-blur-sm transition-all z-10"><ChevronRight className="w-6 h-6 text-white" /></button>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-2 rounded-full transition-all ${idx === currentSlide ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/50'}`} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white relative z-20 -mt-10 rounded-t-[3rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Calendar, label: 'Founded', value: '2012' },
              { icon: Building, label: 'Projects', value: '6+' },
              { icon: Users, label: 'Happy Families', value: '15,000+' },
              { icon: Shield, label: 'Legal Clarity', value: '100%' }
            ].map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] p-6 rounded-xl text-white text-center hover:scale-105 transition-transform shadow-lg">
                <stat.icon className="h-10 w-10 mx-auto mb-3 text-[#D4AF37]" />
                <div className="text-3xl md:text-4xl font-bold mb-1">{stat.value}</div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Calculator */}
      <div className="bg-gray-50"><EMICalculatorSection /></div>

      {/* All Projects Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-4xl font-bold text-[#0F3A5F] mb-4">All Our Projects</h2>
              <p className="text-xl text-gray-600">Explore premium plotted developments across sacred locations</p>
            </motion.div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, idx) => (
              <motion.div key={project.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center min-h-[200px] relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0F3A5F]/5 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img src={project.logo} alt={project.nameEn} className="max-w-full max-h-[180px] object-contain drop-shadow-lg group-hover:scale-110 transition-transform relative z-10" />
                  {project.highlight && <div className="absolute top-2 right-2"><Star className="w-6 h-6 text-[#D4AF37] fill-[#D4AF37]" /></div>}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#0F3A5F] mb-1">{project.nameEn}</h3>
                  <p className="text-sm text-gray-600 mb-4 flex items-center gap-1"><MapPin className="w-4 h-4" />{project.location}</p>
                  
                  {/* Mobile-friendly pricing - stacked layout */}
                  <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-500">Starting From</span>
                      <span className="text-base font-bold text-[#0F3A5F]">{project.startingPrice}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-500">Booking ({project.bookingPct})</span>
                      <span className="text-sm font-bold text-[#D4AF37]">{project.bookingAmt}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-gray-500">Monthly EMI</span>
                      <span className="text-base font-bold text-[#0F3A5F]">{project.emi}</span>
                    </div>
                    <div className="pt-1 border-t border-gray-200">
                      <p className="text-xs text-gray-400 text-center">{project.emiMonths}-month plan · 0% interest</p>
                    </div>
                  </div>

                  <Link to={`/projects/${project.id}`}>
                    <Button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8941E] hover:from-[#B8941E] hover:to-[#96760F] text-black font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                      View Details <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plan Your Dream Plot (50-200 sq yd) */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-4 py-2 bg-[#D4AF37]/20 text-[#0F3A5F] rounded-full font-bold mb-4">Choose Your Plot Size</span>
              <h2 className="text-4xl md:text-5xl font-bold text-[#0F3A5F] mb-4">Plan Your Dream Plot</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Select from 50 to 200 sq yd and start your investment journey</p>
            </motion.div>
          </div>
          
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {plotSizes.map((size, idx) => (
              <motion.div
                key={size}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-[#D4AF37] cursor-pointer group text-center"
              >
                <div className="text-3xl font-bold text-[#0F3A5F] group-hover:text-[#D4AF37] transition-colors mb-2">{size}</div>
                <div className="text-sm text-gray-500">Sq. Yd.</div>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <p className="text-gray-600 mb-6">Not sure which size is right for you? Our experts can help!</p>
            <Button 
              size="lg" 
              className="bg-[#D4AF37] hover:bg-[#B8941E] text-black font-bold text-lg px-10 py-6 shadow-xl"
              onClick={() => window.open('https://wa.me/918076146988?text=I\'m interested in plot sizes 50-200 sq yd', '_blank')}
            >
              <MessageCircle className="mr-2" /> Get Expert Advice
            </Button>
          </motion.div>
        </div>
      </section>

      {/* WhatsApp + Contact CTA */}
      <section className="py-20 bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold mb-4">Chat on WhatsApp or Contact Us</h2>
            <p className="text-xl mb-8 text-gray-200">Get instant answers to all your property queries</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-lg px-8 py-6 shadow-xl"
                onClick={() => window.open('https://wa.me/918076146988', '_blank')}
              >
                <MessageCircle className="mr-2" /> Chat on WhatsApp
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-[#0F3A5F] text-lg px-8 py-6"
                onClick={() => window.open('tel:+918076146988')}
              >
                <Phone className="mr-2" /> Call Us Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
