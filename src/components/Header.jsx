
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavMenu } from '@/lib/contentSync';
import { subscribeToContentUpdates, EVENTS } from '@/lib/contentSyncService';

const Header = ({ onBookSiteVisit }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navMenu = useNavMenu();
  const [forcedUpdate, setForcedUpdate] = useState(0);

  useEffect(() => {
    // While useNavMenu hooks handles storage events, explicit requirements state we must listen to menu_updated
    const unsubscribe = subscribeToContentUpdates(EVENTS.MENU_UPDATED, () => {
      // Force update to ensure latest values are reflected if hook is delayed
      setForcedUpdate(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const isActive = (href) => location.pathname === href;

  // Use dynamic menu order from hook
  const navigation = navMenu.order
    .map(id => navMenu.items.find(i => i.id === id))
    .filter(item => item && item.visibility === 'public')
    .map(item => ({
      name: item.label,
      href: item.url
    }));

  return (
    <header className="sticky top-0 z-50 bg-[#0F3A5F] shadow-xl border-b border-[#0F3A5F]/20">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Desktop: Image + Text, Mobile: Text Only */}
          <Link to="/" className="flex items-center space-x-3 group">
            {/* Desktop Logo Image */}
            <img 
              src="https://horizons-cdn.hostinger.com/a5c23928-0ade-41f6-9dc0-f43342fe6739/0944d6d7630214fc8ea9ee8e7243badb.jpg"
              alt="Fanbe Group"
              className="hidden sm:block h-12 w-12 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-white/50 transition-all duration-300"
            />
            {/* Desktop Text */}
            <div className="hidden sm:block">
              <h1 className="text-white font-bold text-xl tracking-tight">Fanbe Group</h1>
              <p className="text-[#D4AF37] text-xs font-medium tracking-wide">SHAPING TOMORROW</p>
            </div>
            {/* Mobile Text Logo - Elegant Rectangle Badge */}
            <div className="sm:hidden px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8941E] rounded-lg shadow-lg">
              <h1 className="text-[#0F3A5F] font-serif font-bold text-lg tracking-wider">FANBE GROUP</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
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
            ))}
          </div>

          {/* CTA Button and Admin Login - Desktop */}
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

          {/* Mobile Menu Button */}
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
                {navigation.map((item) => (
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
                ))}
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
