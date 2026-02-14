
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import projects from '@/data/projects';

const ProjectsPage = ({ onBookSiteVisit }) => {
  const featured = projects.find(p => p.id === 'shree-kunj-bihari-enclave') || projects[0];
  const others = projects.filter(p => p.id !== featured.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-gray-50 min-h-screen"
    >
      <Helmet>
        <title>Projects | Fanbe Group</title>
        <meta name="description" content="Explore our premium residential projects. Featured: Shree Kunj Bihari Enclave in Vrindavan." />
      </Helmet>

      {/* Featured Project Hero */}
      <section className="bg-[#0F3A5F] text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="bg-[#D4AF37] text-[#0F3A5F] px-4 py-1 rounded-full text-sm font-bold tracking-wide mb-6 inline-block">
              FEATURED PROJECT
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{featured.name}</h1>
            <p className="text-xl text-gray-300 flex items-center justify-center mb-8">
              <MapPin className="h-5 w-5 mr-2 text-[#D4AF37]" />
              {featured.location}
            </p>
            <p className="text-lg text-gray-200 leading-relaxed max-w-2xl mx-auto mb-10">
              {featured.description}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={onBookSiteVisit} className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] px-8 py-3 font-bold rounded-lg text-lg">
                Schedule Site Visit
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Details */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-12">
              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-[#0F3A5F] mb-6">Location & Connectivity</h3>
                <p className="text-gray-600 mb-4">
                  Situated in the heart of Vrindavan, this project offers seamless connectivity to major temples and the highway.
                  Experience the peace of divinity with the convenience of modern infrastructure.
                </p>
                <ul className="grid md:grid-cols-2 gap-4">
                  <li className="flex items-center text-gray-700"><Check className="h-4 w-4 text-[#D4AF37] mr-2" /> Near Prem Mandir</li>
                  <li className="flex items-center text-gray-700"><Check className="h-4 w-4 text-[#D4AF37] mr-2" /> Connected to Yamuna Expressway</li>
                  <li className="flex items-center text-gray-700"><Check className="h-4 w-4 text-[#D4AF37] mr-2" /> 10 Mins from Railway Station</li>
                  <li className="flex items-center text-gray-700"><Check className="h-4 w-4 text-[#D4AF37] mr-2" /> Developed Neighborhood</li>
                </ul>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg">
                <h3 className="text-2xl font-bold text-[#0F3A5F] mb-6">Master Planning & Facilities</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {featured.amenities.map((item, idx) => (
                    <div key={idx} className="flex items-start">
                      <div className="w-2 h-2 mt-2 rounded-full bg-[#0F3A5F] mr-3" />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg border border-[#D4AF37]/20">
                <h3 className="text-2xl font-bold text-[#0F3A5F] mb-6">Plot Options & Benefits</h3>
                <div className="grid md:grid-cols-3 gap-6 text-center mb-8">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Starting Size</div>
                    <div className="text-xl font-bold text-[#2C2C2C]">50 Sq. Yd.</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">EMI Starts</div>
                    <div className="text-xl font-bold text-[#2C2C2C]">₹5,600/mo</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Interest Free</div>
                    <div className="text-xl font-bold text-[#2C2C2C]">59 Months</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className="bg-[#0F3A5F] text-white p-8 rounded-xl shadow-lg">
                  <h3 className="text-xl font-bold mb-4">Who This Is For?</h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#D4AF37] mr-3 flex-shrink-0" />
                      <span>Devotees seeking a home in Braj</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#D4AF37] mr-3 flex-shrink-0" />
                      <span>Investors looking for high appreciation</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-[#D4AF37] mr-3 flex-shrink-0" />
                      <span>Retirees looking for a peaceful life</span>
                    </li>
                  </ul>
                  <Button onClick={onBookSiteVisit} className="w-full mt-8 bg-white text-[#0F3A5F] hover:bg-gray-100 font-bold">
                    Book Site Visit
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Other Projects Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#0F3A5F] mb-12 text-center">Other Investment Opportunities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {others.map((project) => (
              <div key={project.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all group">
                <div className="p-6">
                  <h4 className="text-xl font-bold text-[#2C2C2C] mb-2">{project.name}</h4>
                  <p className="text-gray-500 text-sm mb-4 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" /> {project.location}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-6">{project.shortDescription}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs font-semibold bg-[#0F3A5F]/10 text-[#0F3A5F] px-2 py-1 rounded">
                      Details on Request
                    </span>
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="ghost" size="sm" className="text-[#0F3A5F] hover:text-[#D4AF37]">
                        <FileText className="h-4 w-4 mr-2" /> Request Brochure
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default ProjectsPage;
