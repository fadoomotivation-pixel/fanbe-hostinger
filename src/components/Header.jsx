import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavMenu } from '@/lib/contentSync';
import { subscribeToContentUpdates, EVENTS } from '@/lib/contentSyncService';
import { projectsData } from '@/data/projectsData';

const Header = ({ onBookSiteVisit }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navMenu = useNavMenu();
  const [forcedUpdate, setForcedUpdate] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToContentUpdates(EVENTS.MENU_UPDATED, () => {
      setForcedUpdate(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.projects-dropdown-container')) {
        setProjectsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (href) => location.pathname === href;

  const navigation = navMenu.order
    .map(id => navMenu.items.find(i => i.id === id))
    .filter(item => item && item.visibility === 'public')
    .map(item => ({
      name: item.label,
      href: item.url
    }));

  const handleProjectClick = (slug) => {
    setProjectsDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate(`/projects/${slug}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0F3A5F] shadow-xl border-b border-[#0F3A5F]/20">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8941E] rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
              <h1 className="text-[#0F3A5F] font-serif font-bold text-lg tracking-wider">FANBE GROUP</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => {
              // Special handling for Projects link
              if (item.href === '/projects') {
                return (
                  <div key={item.name} className="relative projects-dropdown-container">
                    <button
                      onClick={() => setProjectsDropdownOpen(!projectsDropdownOpen)}
                      className={`text-sm font-medium tracking-wide transition-all duration-300 relative py-1 flex items-center gap-1 ${
                        isActive(item.href) || location.pathname.startsWith('/projects/')
                          ? 'text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {item.name}
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-300 ${projectsDropdownOpen ? 'rotate-180' : ''}`}
                      />
                      {(isActive(item.href) || location.pathname.startsWith('/projects/')) && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>

                    {/* Projects Mega Dropdown */}
                    <AnimatePresence>
                      {projectsDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                        >
                          <div className="bg-gradient-to-r from-[#0F3A5F] to-[#1a5a8f] px-6 py-4">
                            <h3 className="text-white font-bold text-lg">Our Premium Projects</h3>
                            <p className="text-blue-200 text-sm mt-1">Choose your dream property</p>
                          </div>
                          <div className="p-4 grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                            {projectsData.map((project) => (
                              <button
                                key={project.slug}
                                onClick={() => handleProjectClick(project.slug)}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-all group border border-transparent hover:border-[#D4AF37]"
                              >
                                <div className="w-16 h-16 bg-white rounded-lg p-2 shadow-md flex-shrink-0 group-hover:scale-110 transition-transform">
                                  <img 
                                    src={project.logo} 
                                    alt={project.title}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.target.src = project.heroImage;
                                    }}
                                  />
                                </div>
                                <div className="flex-1 text-left">
                                  <h4 className="font-bold text-[#0F3A5F] text-sm group-hover:text-[#D4AF37] transition-colors">
                                    {project.title}
                                  </h4>
                                  <p className="text-xs text-gray-600 mt-1">{project.location}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                          <div className="bg-gray-50 px-6 py-3 border-t">
                            <Link
                              to="/projects"
                              onClick={() => setProjectsDropdownOpen(false)}
                              className="text-[#0F3A5F] font-semibold text-sm hover:text-[#D4AF37] transition-colors"
                            >
                              View All Projects →
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              // Regular links
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`text-sm font-medium tracking-wide transition-all duration-300 relative py-1 ${
                    isActive(item.href)
                      ? 'text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.name}
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* CTA + Admin — Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              onClick={onBookSiteVisit}
              className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] px-6 py-2 rounded-lg font-bold transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Book Site Visit
            </Button>
            <Link
              to="/crm/login"
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-300 hover:underline"
            >
              Admin Login
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden mt-4 overflow-hidden"
            >
              <div className="flex flex-col space-y-2 pb-4">
                {navigation.map((item) => {
                  // Mobile Projects Dropdown
                  if (item.href === '/projects') {
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => setProjectsDropdownOpen(!projectsDropdownOpen)}
                          className={`w-full text-left text-base font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                            isActive(item.href) || location.pathname.startsWith('/projects/')
                              ? 'bg-white/10 text-white'
                              : 'text-gray-300 hover:bg-white/5'
                          }`}
                        >
                          {item.name}
                          <ChevronDown 
                            size={16} 
                            className={`transition-transform duration-300 ${projectsDropdownOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        
                        {/* Mobile Projects List */}
                        <AnimatePresence>
                          {projectsDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 ml-4 space-y-2 overflow-hidden"
                            >
                              {projectsData.map((project) => (
                                <button
                                  key={project.slug}
                                  onClick={() => handleProjectClick(project.slug)}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all text-left"
                                >
                                  <div className="w-12 h-12 bg-white rounded-lg p-1.5 shadow-md flex-shrink-0">
                                    <img 
                                      src={project.logo} 
                                      alt={project.title}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.target.src = project.heroImage;
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-white text-sm">
                                      {project.title}
                                    </h4>
                                    <p className="text-xs text-gray-300 mt-0.5">{project.location}</p>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  // Regular mobile links
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-base font-medium px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.href)
                          ? 'bg-white/10 text-white'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onBookSiteVisit();
                    }}
                    className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] w-full py-3 rounded-lg font-bold"
                  >
                    Book Site Visit
                  </Button>
                </div>
                <Link
                  to="/crm/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-white/5"
                >
                  Admin Login
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;
