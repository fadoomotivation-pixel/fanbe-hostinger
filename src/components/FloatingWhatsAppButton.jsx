
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useWhatsApp } from '@/lib/useWhatsApp';

const FloatingWhatsAppButton = () => {
  const { getWhatsAppLink } = useWhatsApp();

  const handleClick = () => {
    window.open(getWhatsAppLink('Hello I am interested in Fanbe Group projects. Please share details.'), '_blank');
  };

  return (
    <div 
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 cursor-pointer animate-bounce-slow"
    >
      <div className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 group">
        <MessageCircle size={28} fill="white" className="text-white" />
        <span className="font-bold text-lg hidden md:inline">Chat with us</span>
      </div>
    </div>
  );
};

export default FloatingWhatsAppButton;
