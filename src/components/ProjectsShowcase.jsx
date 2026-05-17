import React, { useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsData } from '@/data/projectsData';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { subscribeToContentUpdates, EVENTS } from '@/lib/contentSyncService';
import { useToast } from '@/components/ui/use-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Storage — single source of truth for hero images
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_STORAGE_URL = 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images';

const PROJECT_FOLDER_MAP = {
  'shree-kunj-bihari':  'projects/shree-kunj-bihari',
  'khatu-shyam-enclave':'projects/khatu-shyam-enclave',
  'brij-vatika':        'projects/brij-vatika',
  'jagannath-dham':     'projects/jagannath-dham',
  'gokul-vatika':       'projects/gokul-vatika',
  'maa-semri-vatika':   'projects/maa-semri-vatika',
};

const getSupabaseHeroUrl = (slug) => {
  const folder = PROJECT_FOLDER_MAP[slug];
  return folder ? `${SUPABASE_STORAGE_URL}/${folder}/hero.jpg` : null;
};

const ProjectsShowcase = () => {
  const { toast } = useToast();

  // Build displayed projects with Supabase hero URLs directly (no async flash)
  const displayedProjects = useMemo(() =>
    projectsData.map(p => ({
      ...p,
      heroImage: getSupabaseHeroUrl(p.slug) || p.heroImage,
      fallbackImage: p.heroImage, // Unsplash fallback if Supabase fails
    })),
    []
  );

  useEffect(() => {
    const unsubscribe = subscribeToContentUpdates(EVENTS.PROJECT_IMAGE_UPDATED, () => {
      toast({ title: "Updated", description: "Projects updated in real-time!" });
    });
    return () => unsubscribe();
  }, [toast]);

  return (
    <section className="py-16 md:py-24 bg-[#F5F5F5]">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F3A5F] mb-3">Our Projects</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our premium plotted developments designed for your spiritual and peaceful living.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {displayedProjects.map((project) => (
            <div 
              key={project.slug}
              className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform lg:hover:scale-105 bg-white aspect-video"
            >
              {/* Background Image with Lazy Loading */}
              <img
                src={project.heroImage}
                alt={`${project.title} - Fanbe Group`}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 lg:group-hover:scale-110"
                onError={(e) => {
                  if (project.fallbackImage && e.target.src !== project.fallbackImage) {
                    e.target.src = project.fallbackImage;
                  }
                }}
              />
              
              {/* Fallback/Skeleton Background (visible if img fails or loading) */}
              <div className="absolute inset-0 bg-gray-200 -z-10 animate-pulse" />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 lg:opacity-70 lg:group-hover:opacity-90 transition-opacity" />

              {/* Content Overlay */}
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="transform transition-transform duration-300 translate-y-2 lg:group-hover:translate-y-0">
                  <h3 className="text-white font-bold text-xl md:text-2xl mb-1 leading-tight drop-shadow-md">
                    {project.title}
                  </h3>
                  <p className="text-gray-300 text-sm md:text-base font-medium mb-4 line-clamp-1">
                    {project.subline}
                  </p>
                  
                  <div className="flex gap-3 mt-4 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                    <Link to={`/projects/${project.slug}`} className="flex-1">
                      <Button className="w-full bg-white text-[#0F3A5F] hover:bg-gray-100 font-bold border-0">
                        View Details
                      </Button>
                    </Link>
                    <a href={project.whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-none">
                      <Button size="icon" className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg w-10 h-10">
                        <MessageCircle size={20} />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectsShowcase;