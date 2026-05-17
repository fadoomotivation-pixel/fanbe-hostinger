
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Phone, Calendar, CheckSquare, ClipboardList, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/permissions';

const EmployeeFAB = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (user?.role !== ROLES.EMPLOYEE) return null;

  const actions = [
    { label: 'View My Leads', icon: Users, path: '/crm/my-leads' },
    { label: 'Log Call', icon: Phone, path: '/crm/sales/daily-calling' },
    { label: 'Log Site Visit', icon: MapPin, path: '/crm/sales/site-visits' },
    { label: 'Log Booking', icon: CheckSquare, path: '/crm/sales/bookings' },
    { label: 'Submit EOD Report', icon: ClipboardList, path: '/crm/sales/eod-reports' },
    { label: 'View Tasks', icon: Calendar, path: '/crm/sales/tasks' },
  ];

  const handleAction = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" ref={menuRef}>
        <AnimatePresence>
            {isOpen && (
                <div className="mb-4 flex flex-col items-end space-y-3">
                    {actions.map((action, idx) => (
                        <motion.button
                           key={idx}
                           initial={{ opacity: 0, y: 20, scale: 0.8 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0, y: 20, scale: 0.8 }}
                           transition={{ duration: 0.2, delay: idx * 0.05 }}
                           onClick={() => handleAction(action.path)}
                           className="flex items-center gap-3 bg-white text-gray-800 px-4 py-2.5 rounded-lg shadow-lg hover:bg-gray-50 border border-gray-100 transition-colors group"
                        >
                            <span className="text-sm font-medium whitespace-nowrap text-gray-700 group-hover:text-[#059669]">{action.label}</span>
                            <div className="p-1.5 bg-green-50 rounded-full text-[#059669]">
                                <action.icon size={16} />
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}
        </AnimatePresence>
        
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`
                h-14 w-14 rounded-full shadow-xl flex items-center justify-center text-white
                transition-colors duration-300 border-2 border-white
                ${isOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-[#059669] hover:bg-[#047857]'}
            `}
        >
            <motion.div
                animate={{ rotate: isOpen ? 135 : 0 }}
                transition={{ duration: 0.3 }}
            >
                <Plus size={28} />
            </motion.div>
        </motion.button>
    </div>
  );
};

export default EmployeeFAB;
