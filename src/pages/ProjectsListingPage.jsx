import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { projectsData } from '@/data/projectsData';
import ProjectCard from '@/components/ProjectCard';
import SiteVisitLeadModal from '@/components/SiteVisitLeadModal';

const ProjectsListingPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');

  const handleBookVisit = (slug) => {
    setSelectedProject(slug);
    setModalOpen(true);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 md:py-20">
      <Helmet>
        <title>Our Projects | Fanbe Group - Premium Real Estate in Braj</title>
        <meta name="description" content="Explore our portfolio of premium residential projects in Vrindavan, Mathura, and Rajasthan. Find your dream plot today." />
      </Helmet>

      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0F3A5F] mb-6">Our Premium Projects</h1>
          <p className="text-lg text-gray-600">
            Discover thoughtfully designed residential enclaves in the most spiritual locations of India. 
            Secure your future with Fanbe Group's trusted developments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projectsData.map((project) => (
            <ProjectCard 
              key={project.slug} 
              project={project} 
              onBookVisit={handleBookVisit}
            />
          ))}
        </div>

        <div className="mt-20 bg-white rounded-2xl p-8 md:p-12 shadow-xl border border-[#D4AF37]/20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0F3A5F] mb-4">Cannot decide which project is best for you?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Our expert property consultants can help you find the perfect plot based on your budget and preferences.
          </p>
          <button 
            onClick={() => handleBookVisit('')}
            className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] font-bold py-3 px-8 rounded-lg text-lg transition-transform hover:scale-105 shadow-md"
          >
            Talk to an Expert
          </button>
        </div>
      </div>

      <SiteVisitLeadModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        preSelectedProjectSlug={selectedProject} 
      />
    </div>
  );
};

export default ProjectsListingPage;