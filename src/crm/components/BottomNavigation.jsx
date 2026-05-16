
import React from 'react';
import { motion } from 'framer-motion';
import { ListFilter, Clock, CheckCircle, XCircle } from 'lucide-react';

const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'daily', label: 'Open', icon: ListFilter },
    { id: 'followup', label: 'Follow-up', icon: Clock },
    { id: 'booked', label: 'Booked', icon: CheckCircle },
    { id: 'lost', label: 'Lost', icon: XCircle },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind navbar on mobile */}
      <div className="h-[60px] md:hidden" />
      
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:relative md:border-t-0 md:bg-transparent md:z-0">
        <div className="flex justify-around items-center h-[56px] md:h-auto md:justify-start md:gap-4 md:bg-gray-100/80 md:p-1 md:rounded-xl md:inline-flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex flex-col md:flex-row items-center justify-center w-full md:w-auto md:px-6 md:py-2.5 
                  transition-all duration-200 relative
                  ${isActive ? 'text-[#1E88E5] md:bg-white md:shadow-sm md:rounded-lg' : 'text-gray-400 hover:text-gray-600'}
                `}
              >
                <tab.icon size={isActive ? 24 : 22} className={`mb-1 md:mb-0 md:mr-2 transition-all ${isActive ? 'scale-110' : ''}`} />
                <span className={`text-[10px] md:text-sm font-medium ${isActive ? 'font-bold' : ''}`}>
                  {tab.label}
                </span>
                
                {/* Mobile Active Indicator Line */}
                {isActive && (
                  <motion.div 
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 left-0 right-0 h-0.5 bg-[#1E88E5] md:hidden" 
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BottomNavigation;
