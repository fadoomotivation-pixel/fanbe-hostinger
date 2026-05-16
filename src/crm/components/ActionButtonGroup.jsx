
import React from 'react';
import { Phone, MessageCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const ActionButtonGroup = ({ lead, onAction, onStatusChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
      {/* Call Button */}
      <Button
        className="bg-[#1E88E5] hover:bg-[#1976D2] text-white h-11 md:h-12 w-full shadow-sm active:scale-95 transition-transform"
        onClick={(e) => { e.stopPropagation(); onAction('call', lead); }}
      >
        <Phone className="mr-2 h-5 w-5" /> Call
      </Button>

      {/* WhatsApp Button */}
      <Button
        className="bg-[#25D366] hover:bg-[#20bd5a] text-white h-11 md:h-12 w-full shadow-sm active:scale-95 transition-transform"
        onClick={(e) => { e.stopPropagation(); onAction('whatsapp', lead); }}
      >
        <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
      </Button>

      {/* Status Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="border-[#FFC107] text-gray-800 hover:bg-[#FFC107]/10 h-11 md:h-12 w-full shadow-sm active:scale-95 transition-transform flex justify-between px-4 bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${
                lead.status === 'Open' ? 'bg-blue-500' :
                lead.status === 'FollowUp' ? 'bg-orange-500' :
                lead.status === 'Booked' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {lead.status}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem onClick={() => onStatusChange(lead, 'Open')} className="cursor-pointer">
            <span className="h-2 w-2 rounded-full bg-blue-500 mr-2" /> Open
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(lead, 'FollowUp')} className="cursor-pointer">
            <span className="h-2 w-2 rounded-full bg-orange-500 mr-2" /> Follow Up
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(lead, 'Booked')} className="cursor-pointer">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2" /> Booked
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onStatusChange(lead, 'Lost')} className="cursor-pointer">
            <span className="h-2 w-2 rounded-full bg-red-500 mr-2" /> Lost
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ActionButtonGroup;
