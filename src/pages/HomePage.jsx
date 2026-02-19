import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, ChevronLeft, Shield, Calendar, Building, Users, 
  CheckCircle, Phone, MapPin, Star, MessageCircle, Handshake
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitSiteVisit } from '@/lib/storage';
import { getProjectImagesFromDB } from '@/lib/contentStorage';
import { useToast } from '@/components/ui/use-toast';
import EMICalculatorSection from '@/components/EMICalculatorSection';
import PresetPlotCards from '@/components/PresetPlotCards';
import { useWhatsApp } from '@/lib/useWhatsApp';

const projects = [
  {
    id: 'khatu-shyam-enclave',
    slug: 'khatu-shyam-enclave',
    nameEn: 'Shri Khatu Shyam Enclave',
    logo: '/images/projects/khatu_shyam_enclave.png',
    location: 'Near Khatu Shyam Temple, Rajasthan',
    highlight: true,
    startingPrice: '₹3.76 Lakhs',
    bookingAmt: '₹37,625 (10%)',
    emi: '₹5,644/month',
    emiMonths: 60,
    bookingPct: '10%',
    status: 'Limited Plots Available',
  },
  {
    id: 'shree-kunj-bihari-enclave',
    slug: 'shree-kunj-bihari',
    nameEn: 'Shree Kunj Bihari Enclave',
    logo: '/images/projects/shree_kunj_bihari_enclave.png',
    location: 'Vrindavan, UP',
    highlight: true,
    startingPrice: '₹3.76 Lakhs',
    bookingAmt: '₹37,625 (10%)',
    emi: '₹5,644/month',
    emiMonths: 60,
    bookingPct: '10%',
    status: 'Best Seller',
  },
  {
    id: 'gokul-vatika',
    slug: 'gokul-vatika',
    nameEn: 'Gokul Vatika',
    logo: '/images/projects/gokul_vatika.png',
    location: 'Mathura-Vrindavan Road',
    startingPrice: '₹5.01 Lakhs',
    bookingAmt: '₹1,75,438 (35%)',
    emi: '₹13,576/month',
    emiMonths: 24,
    bookingPct: '35%',
    status: 'Available'
  },
  {
    id: 'semri-vatika',
    slug: 'maa-simri-vatika',
    nameEn: 'Maa Semri Vatika',
    logo: '/images/projects/semri_vatika.png',
    location: 'Semri, Mathura',
    startingPrice: '₹7.76 Lakhs',
    bookingAmt: '₹2,71,688 (35%)',
    emi: '₹21,024/month',
    emiMonths: 24,
    bookingPct: '35%',
    status: 'New Launch'
  },
  {
    id: 'jagannath-dham',
    slug: 'jagannath-dham',
    nameEn: 'Jagannath Dham',
    logo: '/images/projects/jaganath_dham.png',
    location: 'Vrindavan Highway',
    startingPrice: '₹4.01 Lakhs',
    bookingAmt: '₹50,156 (12.5%)',
    emi: '₹6,502/month',
    emiMonths: 54,
    bookingPct: '12.5%',
    status: 'Available'
  },
  {
    id: 'brij-vatika',
    slug: 'brij-vatika',
    nameEn: 'Brij Vatika (E Block)',
    logo: '/images/projects/brij_vatika.png',
    location: 'Braj Bhoomi, Vrindavan',
    startingPrice: '₹7.76 Lakhs',
    bookingAmt: '₹2,71,688 (35%)',
    emi: '₹12,615/month',
    emiMonths: 40,
    bookingPct: '35%',
    status: 'Available'
  }
];

const slides = [
  {
    id: 1,
    title: 'A Culture of Success',
    subtitle: 'Celebrating Excellence & Partnership',
    description: "Fanbe's Business Meets and Gold Achiever ceremonies"
  },
  {
    id: 2,
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
    title: 'सुविधाएं जो जीवन को आसान बनाएं',
    subtitle: 'Modern Amenities',
    points: [
      'भव्य प्रवेश द्वार: सुरक्षा गार्ड के साथ',
      'पक्की सड़कें: कॉलोनी के अंदर चौड़ी सड़कें',
      'हरा-भरा वातावरण: प्रदूषण मुक्त और ताज़ी हवा',
      'बिजली और पानी: बुनियादी ढांचे की पूरी व्यवस्था'
    ]
  },
  {
    id: 4,
    title: 'चैनल पार्टनर बनें',
    subtitle: 'Join as Channel Partner',
    points: [
      'आकर्षक कमीशन: हर सफल बुकिंग पर बेहतरीन कमीशन',
      'मार्केटिंग सपोर्ट: प्रमोशनल मटेरियल और ट्रेनिंग',
      'समय की स्वतंत्रता: अपनी सुविधा के अनुसार काम करें',
      'विश्वसनीय कंपनी: 2012 से 15,000+ खुश परिवारों का भरोसा'
    ],
    cta: {
      text: 'अभी जुड़ें',
      icon: Handshake
    }
  }
];

const HomePage = ({ onBookSiteVisit }) => {
  const { toast } = useToast();
  const { getWhatsAppLink } = useWhatsApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbImages, setDbImages] = useState({});

  useEffect(() => {
    getProjectImagesFromDB().then(imgs => setDbImages(imgs));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Fanbe Group - Premium Plotted Developments in Vrindavan & Mathura</title>
        <meta name="description" content="Discover spiritual living with Fanbe Group's premium plots in Vrindavan, Mathura, and Braj Bhoomi. RERA approved, transparent pricing, easy EMI." />
      </Helmet>

      {/* Hero Slider */}
      <section className="relative h-[460px] md:h-[520px] overflow-hidden bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f]">
        <AnimatePresence mode="wait">
          <motion.div key={currentSlide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F3A5F]/95 to-[#0F3A5F]/70" />
            <div className="relative h-full flex items-center justify-center px-16 md:px-24">
              <div className="w-full max-w-3xl text-white text-center">
                <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                  className="text-2xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
                  {slides[currentSlide].title}
                </motion.h2>
                <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}
                  className="text-lg md:text-xl lg:text-2xl text-[#D4AF37] mb-4 md:mb-6">
                  {slides[currentSlide].subtitle}
                </motion.p>
                {slides[currentSlide].points && (
                  <motion.ul initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 }}
                    className="space-y-2 md:space-y-3 mb-6 md:mb-8 max-w-xl mx-auto">
                    {slides[currentSlide].points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 md:gap-3 justify-center">
                        <CheckCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                        <span className="text-sm md:text-base leading-snug text-left">{point}</span>
                      </li>
                    ))}
                  </motion.ul>
                )}
                {slides[currentSlide].description && (
                  <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 }}
                    className="text-base md:text-xl mb-6 md:mb-8">
                    {slides[currentSlide].description}
                  </motion.p>
                )}
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.65 }}
                  className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
                  {slides[currentSlide].cta ? (
                    <Button size="lg" className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#B8941E] text-black font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-xl"
                      onClick={() => window.open('https://wa.me/918076146988?text=मैं%20चैनल%20पार्टनर%20बनने%20में%20रुचि%20रखता%20हूं', '_blank')}>
                      {slides[currentSlide].cta.icon && <slides[currentSlide].cta.icon className="mr-2" />}
                      {slides[currentSlide].cta.text}
                    </Button>
                  ) : (
                    <Link to="/projects">
                      <Button size="lg" className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#B8941E] text-black font-bold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-xl">
                        Explore Projects <ChevronRight className="ml-2" />
                      </Button>
                    </Link>
                  )}
                  <Button size="lg" variant="outline"
                    className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-[#0F3A5F] text-base md:text-lg px-6 md:px-8 py-5 md:py-6"
                    onClick={() => window.open('https://wa.me/918076146988', '_blank')}>
                    <Phone className="mr-2" /> Contact Us
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2.5 md:p-3 rounded-full backdrop-blur-sm transition-all z-10">
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>
        <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 p-2.5 md:p-3 rounded-full backdrop-blur-sm transition-all z-10">
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </button>
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${idx === currentSlide ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-white/50'}`} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white relative z-20 -mt-10 rounded-t-[3rem] shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Calendar, label: 'Founded',        value: '2012'    },
              { icon: Building, label: 'Projects',       value: '25+'     },
              { icon: Users,   label: 'Happy Families', value: '15,000+' },
              { icon: Shield,  label: 'Legal Clarity',  value: '100%'    }
            ].map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] p-6 rounded-xl text-white text-center hover:scale-105 transition-transform shadow-lg">
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
              <motion.div key={project.id}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group"
              >
                {/* Logo area with full-cover + zoom effect */}
                <div className="bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] h-[240px] relative overflow-hidden">
                  {/* Gold overlay on hover */}
                  <div className="absolute inset-0 bg-[#D4AF37]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Logo fills entire div + 110% zoom on hover */}
                  <img
                    src={dbImages[project.slug] || project.logo}
                    alt={project.nameEn}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  
                  {/* Star badge for highlights */}
                  {project.highlight && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                      <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-[#0F3A5F] mb-1">{project.nameEn}</h3>
                  <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />{project.location}
                  </p>
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
                  <Link to={`/projects/${project.slug}`}>
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

      {/* Plan Your Dream Plot */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="inline-block px-4 py-2 bg-[#D4AF37]/20 text-[#0F3A5F] rounded-full font-bold mb-4">Choose Your Plot Size</span>
              <h2 className="text-4xl md:text-5xl font-bold text-[#0F3A5F] mb-4">Plan Your Dream Plot</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Choose from our popular plot sizes that fit your monthly budget perfectly</p>
            </motion.div>
          </div>
          <PresetPlotCards onSelectPlot={() => window.open('https://wa.me/918076146988?text=I%20am%20interested%20in%20a%20plot', '_blank')} />
        </div>
      </section>

      {/* WhatsApp + Contact CTA */}
      <section className="py-20 bg-gradient-to-br from-[#0F3A5F] to-[#1a5a8f] text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl font-bold mb-4">Chat on WhatsApp or Contact Us</h2>
            <p className="text-xl mb-8 text-gray-200">Get instant answers to all your property queries</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-[#25D366] hover:bg-[#1da851] text-white font-bold text-lg px-8 py-6 shadow-xl"
                onClick={() => window.open('https://wa.me/918076146988', '_blank')}>
                <MessageCircle className="mr-2" /> Chat on WhatsApp
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#0F3A5F] text-lg px-8 py-6"
                onClick={() => window.open('tel:+918076146988')}>
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
