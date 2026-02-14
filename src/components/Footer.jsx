
import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useWhatsApp } from '@/lib/useWhatsApp';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { phoneNumber, getWhatsAppLink } = useWhatsApp();

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Projects', href: '/#projects' },
    { name: 'Contact', href: '/contact' }
  ];

  const handleLinkClick = (href) => {
    if (href.startsWith('/#')) {
      const element = document.getElementById(href.substring(2));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-[#001F3F] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="https://horizons-cdn.hostinger.com/a5c23928-0ade-41f6-9dc0-f43342fe6739/0944d6d7630214fc8ea9ee8e7243badb.jpg"
                alt="Fanbe Group"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-[#0066A1]"
              />
              <div>
                <span className="text-2xl font-bold">Fanbe Group</span>
                <p className="text-[#0066A1] text-sm font-semibold">Success Starts Here...</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Established in 2012, Fanbe Group has successfully delivered 25+ projects with 15,000+ satisfied customers. 
              We build trust through transparency and quality.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <span className="text-lg font-semibold text-[#0066A1]">Quick Links</span>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                link.href.startsWith('/#') ? (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(link.href);
                      }}
                      className="text-gray-300 hover:text-[#0066A1] transition-colors duration-300 text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ) : (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-[#0066A1] transition-colors duration-300 text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                )
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <span className="text-lg font-semibold text-[#0066A1]">Contact Us</span>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Phone className="text-[#0066A1] mt-1 flex-shrink-0" size={18} />
                <div>
                  <a href={`tel:+91${phoneNumber}`} className="text-gray-300 hover:text-[#0066A1] transition-colors text-sm">
                    +91 {phoneNumber}
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="text-[#0066A1] mt-1 flex-shrink-0" size={18} />
                <div>
                  <a href="mailto:info@fanbegroup.com" className="text-gray-300 hover:text-[#0066A1] transition-colors text-sm">
                    info@fanbegroup.com
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="text-[#0066A1] mt-1 flex-shrink-0" size={18} />
                <span className="text-gray-300 text-sm">
                  Mathura-Vrindavan Road,<br />Uttar Pradesh, India
                </span>
              </li>
            </ul>
          </div>

          {/* Admin Portal Section */}
          <div className="space-y-4 flex flex-col items-start md:items-end"> {/* Align to end on medium screens */}
            <span className="text-lg font-semibold text-[#0066A1]">Admin Access</span>
            <Link 
              to="/crm/login"
              className="bg-[#0F3A5F] text-[#D4AF37] px-6 py-3 rounded-xl font-bold text-base shadow-md transition-all duration-300 
                         hover:bg-[#D4AF37] hover:text-[#0F3A5F] hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center justify-center"
            >
              Admin Portal
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} Fanbe Group. All rights reserved. | 100% Legal Clarity.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
