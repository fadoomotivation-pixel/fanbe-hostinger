import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Target, Users, TrendingUp } from 'lucide-react';

const AboutPage = () => {
  const approaches = [
    { icon: Target, title: "Strategic Location", desc: "We identify high-growth corridors to ensure maximum appreciation." },
    { icon: Shield, title: "Transparent Legal", desc: "100% legal clarity with RERA approvals and clean titles." },
    { icon: Users, title: "Customer First", desc: "Dedicated support from inquiry to possession and beyond." },
    { icon: TrendingUp, title: "Long-term Value", desc: "Developing communities that appreciate in value over generations." }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white min-h-screen"
    >
      <Helmet>
        <title>About Us | Fanbe Group</title>
        <meta name="description" content="Learn about Fanbe Group's 12-year legacy in real estate. Trusted by 15,000+ customers." />
      </Helmet>

      {/* Hero */}
      <section className="bg-[#0F3A5F] py-24 text-center text-white">
        <div className="container mx-auto px-4">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            A Legacy of Trust & Excellence
          </motion.h1>
          <div className="h-1 w-20 bg-[#D4AF37] mx-auto rounded-full" />
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#2C2C2C] mb-8">Who We Are</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Established in 2012, Fanbe Group has emerged as a leading name in real estate development. 
              With over a decade of experience, we have successfully delivered 25+ projects, earning the trust 
              of 15,000+ satisfied customers.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Our core philosophy revolves around transparency, quality, and timely delivery. We believe 
              that buying a property is not just a transaction but a lifetime investment. That's why we ensure 
              every project we undertake meets the highest standards of legal compliance and infrastructural quality.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-[#0F3A5F]">
              <h3 className="text-2xl font-bold text-[#0F3A5F] mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To provide affordable, high-quality residential plots in spiritually significant and high-growth locations. 
                We aim to make property ownership transparent, secure, and accessible for every family.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg border-l-4 border-[#D4AF37]">
              <h3 className="text-2xl font-bold text-[#0F3A5F] mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To be the most trusted real estate developer in the region, known for shaping sustainable communities 
                and delivering unparalleled value to our investors and residents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[#2C2C2C] mb-16">Our Approach</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {approaches.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-16 h-16 mx-auto bg-[#0F3A5F]/10 rounded-full flex items-center justify-center mb-6 text-[#0F3A5F]">
                  <item.icon size={32} />
                </div>
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="py-20 bg-[#0F3A5F] text-white">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-3xl font-bold mb-12">Why We Are Different</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <h4 className="text-[#D4AF37] font-bold text-xl mb-2">12+ Years Legacy</h4>
              <p className="text-gray-300">Proven track record of delivery and trust.</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <h4 className="text-[#D4AF37] font-bold text-xl mb-2">100% Legal Clarity</h4>
              <p className="text-gray-300">Zero tolerance for ambiguity in documentation.</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <h4 className="text-[#D4AF37] font-bold text-xl mb-2">Investor Friendly</h4>
              <p className="text-gray-300">Payment plans designed for your convenience.</p>
            </div>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <h4 className="text-[#D4AF37] font-bold text-xl mb-2">Community Focus</h4>
              <p className="text-gray-300">Building neighborhoods, not just plots.</p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default AboutPage;