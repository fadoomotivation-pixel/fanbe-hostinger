
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Share2 } from 'lucide-react';
import { getDailyTip } from '@/crm/data/salesTips';
import { Button } from '@/components/ui/button';

const SalesTipBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [tip, setTip] = useState('');

  useEffect(() => {
    setTip(getDailyTip());
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 15000); // Increased to 15s to allow reading

    return () => clearTimeout(timer);
  }, []);

  const shareTip = () => {
    const text = `*आज का सेल्स मंत्र* 💡\n${tip}\n- Fanbe CRM`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-4 bg-[#E3F2FD] border-l-4 border-blue-500 rounded-r-lg p-4 relative shadow-sm"
      >
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>

        <div className="flex gap-3">
          <div className="bg-white p-2 rounded-full h-10 w-10 flex items-center justify-center shrink-0 shadow-sm">
            <Lightbulb className="text-yellow-500" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#0F3A5F] text-sm mb-1">आज का सेल्स मंत्र (Today's Sales Mantra)</h3>
            <p className="text-gray-700 text-sm leading-relaxed font-medium">
              "{tip}"
            </p>
            <div className="mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2"
                onClick={shareTip}
              >
                <Share2 size={14} className="mr-1" /> Share
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SalesTipBanner;
