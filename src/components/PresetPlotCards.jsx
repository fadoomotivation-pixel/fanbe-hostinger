
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const PresetPlotCards = ({ onSelectPlot }) => {
  const cards = [
    {
      size: 50,
      booking: '37,250',
      emi: '5,650',
      highlight: false
    },
    {
      size: 100,
      booking: '74,500',
      emi: '11,300',
      highlight: true
    },
    {
      size: 200,
      booking: '1,49,000',
      emi: '22,600',
      highlight: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
      {cards.map((card, index) => (
        <motion.div
          key={card.size}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onSelectPlot(card.size)}
          className={`
            relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl
            ${card.highlight ? 'ring-4 ring-[#FFC107] shadow-lg transform scale-105 z-10' : 'shadow-md bg-white'}
          `}
        >
          {/* Header */}
          <div className="bg-[#1E88E5] py-4 text-center">
            <h3 className="text-white text-2xl font-bold">{card.size} <span className="text-sm font-normal">Sq. Yards</span></h3>
            <p className="text-blue-100 text-xs mt-1">Limited Availability</p>
          </div>

          {/* Body */}
          <div className="bg-white p-6 text-center space-y-4">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Booking Amount</p>
              <p className="text-2xl font-bold text-gray-800">₹{card.booking}</p>
            </div>
            
            <div className="h-px bg-gray-100 w-full my-2" />
            
            <div className="bg-[#FFC107] text-[#0F3A5F] py-2 px-4 rounded-full inline-block font-bold shadow-sm">
              EMI: ₹{card.emi} / mo*
            </div>

            <button className="w-full mt-4 text-[#1E88E5] text-sm font-semibold hover:underline flex items-center justify-center gap-1">
              Select This Plan <Check size={14} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default PresetPlotCards;
