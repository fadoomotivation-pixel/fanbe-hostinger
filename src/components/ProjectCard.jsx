import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProjectCard = ({ project, onBookVisit }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col h-full border border-gray-100">
      <div className="h-56 overflow-hidden relative group">
        <img
          src={project.heroImage}
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-white font-bold text-xl drop-shadow-md">{project.title}</h3>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <p className="text-[#D4AF37] font-medium text-sm mb-2">{project.subline}</p>
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <MapPin size={14} className="mr-1" />
          {project.location}
        </div>
        <p className="text-gray-600 text-sm line-clamp-3 mb-6 flex-grow">
          {project.overview}
        </p>
        
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <Link to={`/projects/${project.slug}`} className="w-full">
             <Button variant="outline" className="w-full h-11 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white transition-colors">
               View Details
             </Button>
          </Link>
          <Button 
            onClick={() => onBookVisit(project.slug)}
            className="w-full h-11 bg-[#0F3A5F] hover:bg-[#0a2742] text-white shadow-md"
          >
            Book Site Visit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;