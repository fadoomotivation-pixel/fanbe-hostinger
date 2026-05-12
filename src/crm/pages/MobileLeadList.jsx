
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Phone, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WhatsAppButton from '@/crm/components/WhatsAppButton';

const MobileLeadList = () => {
  const { leads } = useCRMData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  const myLeads = leads.filter(l => l.assignedTo === user.id);
  const filtered = myLeads.filter(l => l.name.toLowerCase().includes(term.toLowerCase()) || l.phone.includes(term));

  return (
    <div className="pb-24 pt-4 px-4 bg-gray-50 min-h-screen">
       <h1 className="text-xl font-bold mb-4">My Leads</h1>
       
       <div className="bg-white p-2 rounded-lg shadow-sm border mb-4 sticky top-2 z-10 flex items-center">
           <Search size={18} className="text-gray-400 mr-2" />
           <input 
              placeholder="Search leads..." 
              className="flex-1 outline-none text-sm"
              value={term}
              onChange={e => setTerm(e.target.value)}
           />
       </div>

       <div className="space-y-3">
           {filtered.map(lead => (
               <div 
                  key={lead.id} 
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-gray-50"
                  onClick={() => navigate(`/crm/lead/${lead.id}`)}
               >
                   <div className="flex justify-between items-start mb-2">
                       <div>
                           <h3 className="font-bold text-gray-900">{lead.name}</h3>
                           <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1
                               ${lead.status === 'Open' ? 'bg-blue-100 text-blue-700' : 
                                 lead.status === 'Booked' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`
                           }>
                               {lead.status}
                           </span>
                       </div>
                       <ChevronRight size={18} className="text-gray-300" />
                   </div>
                   
                   <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                       <p className="text-xs text-gray-500">{lead.project}</p>
                       <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                           <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => window.location.href=`tel:${lead.phone}`}>
                               <Phone size={14} />
                           </Button>
                           <WhatsAppButton 
                               leadName={lead.name}
                               phoneNumber={lead.phone}
                               size="sm"
                               className="h-8 px-2 rounded-full"
                           />
                       </div>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
};

export default MobileLeadList;
