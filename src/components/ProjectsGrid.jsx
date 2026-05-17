
import React from 'react';
import ProjectCard from './ProjectCard';
import projects from '@/data/projects';

const ProjectsGrid = () => {
  return (
    <section id="projects" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#001F3F] mb-4">
            Our Premium Projects
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our handpicked collection of residential plots in sacred and prime locations. 
            Each project is designed with modern amenities and spiritual essence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsGrid;
