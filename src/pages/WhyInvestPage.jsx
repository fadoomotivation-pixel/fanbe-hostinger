import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { TrendingUp, Map, ShieldCheck, TreePine } from 'lucide-react';

const WhyInvestPage = () => {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Capital Appreciation",
      content: "Our projects are located in high-growth zones near major infrastructure developments and religious hubs. Historical data shows consistent 15-20% annual appreciation in these corridors."
    },
    {
      icon: Map,
      title: "Location Advantage",
      content: "Strategic positioning is our forte. We choose locations with excellent connectivity to highways, ensuring future developability and ease of access for residents."
    },
    {
      icon: ShieldCheck,
      title: "Risk-Managed Investment",
      content: "We prioritize legal clarity. All our projects have clear titles and necessary approvals. We offer a secure investment environment where your capital is protected."
    },
    {
      icon: TreePine,
      title: "Long-Term Value",
      content: "We don't just sell land; we build planned communities. With designated green areas, wide roads, and security, we ensure the livability index remains high, driving long-term value."
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white min-h-screen"
    >
      <Helmet>
        <title>Why Invest | Fanbe Group</title>
        <meta name="description" content="Discover why investing with Fanbe Group is a smart choice. High appreciation, strategic locations, and secure investments." />
      </Helmet>

      {/* Hero */}
      <section className="bg-[#0F3A5F] py-24 text-center text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Smart Investment. Secure Future.</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Real estate remains one of the safest asset classes. Here's why partnering with Fanbe Group maximizes your returns.
          </p>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {benefits.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-[#F5F5F5] rounded-xl flex items-center justify-center text-[#0F3A5F]">
                    <item.icon size={28} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2C2C2C] mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">{item.content}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Data Strip */}
      <section className="py-16 bg-[#F5F5F5] border-y border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <div className="grid md:grid-cols-3 gap-8 divide-x divide-gray-300">
            <div>
              <div className="text-4xl font-bold text-[#0F3A5F] mb-2">15-20%</div>
              <div className="text-gray-600 font-medium">Avg. Annual Appreciation</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0F3A5F] mb-2">0%</div>
              <div className="text-gray-600 font-medium">Hidden Charges</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#0F3A5F] mb-2">100%</div>
              <div className="text-gray-600 font-medium">Transparency</div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default WhyInvestPage;