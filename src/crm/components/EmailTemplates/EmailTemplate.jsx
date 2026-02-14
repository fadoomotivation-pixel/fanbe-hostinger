
import React from 'react';

const EmailTemplate = ({ children, title }) => {
  return (
    <div className="font-sans max-w-2xl mx-auto border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
      {/* Header */}
      <div className="bg-[#0F3A5F] p-6 text-center">
        <h1 className="text-2xl font-bold text-white tracking-wide">Fanbe Group</h1>
        <p className="text-[#D4AF37] text-xs font-medium uppercase tracking-widest mt-1">Building Trust. Creating Value.</p>
      </div>

      {/* Body */}
      <div className="p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-4">{title}</h2>
        <div className="text-gray-600 leading-relaxed space-y-4">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 p-6 text-center text-xs text-gray-500 border-t border-gray-100">
        <p className="mb-2 font-bold text-[#0F3A5F]">Fanbe Group Real Estate</p>
        <p>Mathura-Vrindavan Road, Uttar Pradesh, India</p>
        <p className="mt-2">
          <a href="tel:+919876543210" className="text-blue-600 hover:underline mx-2">+91 98765 43210</a> | 
          <a href="mailto:info@fanbegroup.com" className="text-blue-600 hover:underline mx-2">info@fanbegroup.com</a>
        </p>
        <p className="mt-4 text-gray-400">© {new Date().getFullYear()} Fanbe Group. All rights reserved.</p>
      </div>
    </div>
  );
};

export default EmailTemplate;
