
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const WhatsAppButton = ({ leadName, projectName, phoneNumber, className, size = "default", variant = "default" }) => {
  const handleWhatsAppClick = (e) => {
    e.stopPropagation(); // Prevent row click events
    
    if (!phoneNumber) {
      alert("No phone number available");
      return;
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
    
    // Validate length (simple check for 10 digits)
    if (cleanedPhone.length < 10) {
      alert("Invalid phone number format");
      return;
    }

    // Add country code if missing (assuming India +91)
    const formattedPhone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    // Prepare message
    const message = `Hi ${leadName || 'there'}, I'm calling regarding ${projectName || 'your inquiry'}. Let's discuss your requirements.`;
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp
    const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={handleWhatsAppClick}
            className={`bg-[#25D366] hover:bg-[#1da851] text-white ${className}`}
            size={size}
            variant={variant === "ghost" ? "ghost" : "default"}
          >
            <MessageCircle size={18} className="mr-2" />
            WhatsApp
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Start WhatsApp Chat</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default WhatsAppButton;
