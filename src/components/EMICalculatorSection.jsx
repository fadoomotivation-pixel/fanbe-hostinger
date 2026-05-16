import React, { useState } from 'react';
import EMICalculator from './EMICalculator';
import { Button } from '@/components/ui/button';
import { Phone, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const EMICalculatorSection = ({ onBookSiteVisit }) => {
  const [selectedSize, setSelectedSize] = useState(50);
  const [selectedTenure, setSelectedTenure] = useState(60);

  const openWhatsApp = () => {
    window.open('https://wa.me/918076146988?text=I%20am%20interested%20in%20plotting%20options', '_blank');
  };

  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F3A5F] mb-4">
              Investment Calculator
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Calculate your monthly EMI and plan your investment with ease.
            </p>
          </motion.div>
        </div>

        {/* Calculator */}
        <div id="emi-calculator-card" className="max-w-5xl mx-auto mb-12">
          <EMICalculator initialSize={selectedSize} initialTenure={selectedTenure} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <Button 
            onClick={openWhatsApp}
            className="w-full md:w-auto h-14 px-8 text-lg font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <MessageCircle className="mr-2 h-5 w-5" /> Chat on WhatsApp
          </Button>

          <Button 
            variant="outline"
            className="w-full md:w-auto h-14 px-8 text-lg font-bold border-2 border-[#0F3A5F] text-[#0F3A5F] hover:bg-[#0F3A5F] hover:text-white transition-all"
            onClick={() => window.location.href = '/contact'}
          >
            <Phone className="mr-2 h-5 w-5" /> Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EMICalculatorSection;
