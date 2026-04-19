import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';
import { useWhatsApp } from '@/lib/useWhatsApp';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { phoneNumber, getWhatsAppLink } = useWhatsApp();

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Projects', href: '/projects' },
    { name: 'Why Invest', href: '/why-invest' },
    { name: 'Contact Us', href: '/contact' },
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/fanbegroup', label: 'Facebook' },
    { icon: Instagram, href: 'https://instagram.com/fanbegroup', label: 'Instagram' },
    { icon: Youtube, href: 'https://youtube.com/@fanbegroup', label: 'YouTube' },
    { icon: Twitter, href: 'https://twitter.com/fanbegroup', label: 'Twitter' },
  ];

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
                loading="lazy"
                width="64"
                height="64"
              />
              <div>
                <span className="text-2xl font-bold">Fanbe Group</span>
                <p className="text-[#D4AF37] text-sm font-semibold">Success Starts Here...</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Established in 2012, Fanbe Group has successfully delivered 25+ projects
              with 15,000+ satisfied customers. We build trust through transparency and quality.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-1">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full bg-[#0F3A5F] flex items-center justify-center text-gray-300 hover:bg-[#D4AF37] hover:text-[#0F3A5F] transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <span className="text-lg font-semibold text-[#D4AF37]">Quick Links</span>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-[#D4AF37] transition-colors duration-300 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0066A1] group-hover:bg-[#D4AF37] transition-colors flex-shrink-0" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <span className="text-lg font-semibold text-[#D4AF37]">Contact Us</span>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Phone className="text-[#D4AF37] mt-1 flex-shrink-0" size={16} />
                <div className="space-y-1">
                  <a
                    href={`tel:+91${phoneNumber}`}
                    className="text-gray-300 hover:text-[#D4AF37] transition-colors text-sm block"
                  >
                    +91 {phoneNumber}
                  </a>
                  <a
                    href={getWhatsAppLink('Hello, I want to know more about Fanbe Group projects.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 transition-colors text-xs"
                  >
                    WhatsApp Us →
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="text-[#D4AF37] mt-1 flex-shrink-0" size={16} />
                <a
                  href="mailto:info@fanbegroup.com"
                  className="text-gray-300 hover:text-[#D4AF37] transition-colors text-sm"
                >
                  info@fanbegroup.com
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="text-[#D4AF37] mt-1 flex-shrink-0" size={16} />
                <span className="text-gray-300 text-sm">
                  Plot No. 35, Balaji Tower, 2nd Floor,<br />
                  Ballabhgarh, Haryana 121004
                </span>
              </li>
            </ul>
          </div>

          {/* Portal Access */}
          <div className="space-y-4">
            <span className="text-lg font-semibold text-[#D4AF37]">Portal Access</span>
            <div className="flex flex-col gap-3">
              <Link
                to="/crm/login"
                className="bg-[#0F3A5F] text-[#D4AF37] border border-[#D4AF37]/30 px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-all duration-300
                           hover:bg-[#D4AF37] hover:text-[#0F3A5F] hover:shadow-xl hover:-translate-y-0.5 inline-flex items-center justify-center"
              >
                🏢 Admin Portal
              </Link>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">
              CIN: U70100HR2012PTC046893
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-gray-400 text-sm text-center sm:text-left">
            © {currentYear} Fanbe Group. All rights reserved. | 100% Legal Clarity.
          </p>
          <p className="text-gray-600 text-xs">
            Designed &amp; Developed with ❤️ for Fanbe Group
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
