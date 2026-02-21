import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp, ShieldCheck, Clock, Phone, MessageCircle,
  CheckCircle, ArrowRight, IndianRupee, Users, MapPin,
  Building, Award, FileCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { projectsData } from '@/data/projectsData';

const WhyInvestPage = ({ onBookSiteVisit }) => {
  const [showAllProjects, setShowAllProjects] = useState(false);

  // Real data from projects
  const lowestPrice = Math.min(...projectsData.map(p => p.pricePerSqYard));
  const lowestBooking = Math.min(...projectsData.map(p => p.pricing[0].booking));
  const lowestEmi = Math.min(...projectsData.map(p => p.pricing[0].emi));
  const longestEmi = Math.max(...projectsData.map(p => p.emiMonths));

  const formatPrice = (num) => {
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white min-h-screen"
    >
      <Helmet>
        <title>Zameen Mein Invest Karo | Plot Investment in Mathura Vrindavan | Fanbe Group</title>
        <meta name="description" content={`Sirf ₹${lowestBooking.toLocaleString('en-IN')} mein booking. 0% interest EMI sirf ₹${lowestEmi.toLocaleString('en-IN')}/month. 15,000+ families already trust Fanbe Group. Plots in Mathura, Vrindavan, Kosi Kalan.`} />
      </Helmet>

      {/* Hero — Emotional Hook */}
      <section className="bg-gradient-to-b from-[#0F3A5F] via-[#0F3A5F] to-[#1a5a8f] py-16 md:py-24 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 border border-white/20 rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border border-white/20 rounded-full" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-6 py-2 mb-6">
              <span className="text-[#D4AF37] font-semibold text-sm">Since 2012 &bull; 25+ Projects &bull; 15,000+ Families</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Zameen Ka Paisa<br />
              <span className="text-[#D4AF37]">Kabhi Doobta Nahi</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto mb-4">
              FD mein 6% milta hai, Gold mein risk hai, Share market mein tension hai —
            </p>
            <p className="text-white text-xl md:text-2xl font-bold max-w-3xl mx-auto mb-8">
              Lekin zameen? <span className="text-[#D4AF37]">15-20% har saal badhti hai.</span>
            </p>

            {/* Key Numbers Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">{formatPrice(lowestBooking)}</div>
                <div className="text-gray-300 text-sm mt-1">Se Booking Shuru</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">₹{lowestEmi.toLocaleString('en-IN')}</div>
                <div className="text-gray-300 text-sm mt-1">EMI / Month</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">0%</div>
                <div className="text-gray-300 text-sm mt-1">Interest on EMI</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">{longestEmi} Months</div>
                <div className="text-gray-300 text-sm mt-1">Payment Plan</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/918076146988?text=Mujhe%20plot%20ke%20baare%20mein%20jaankari%20chahiye"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
              >
                <MessageCircle size={22} />
                WhatsApp Pe Pucho
              </a>
              <a
                href="tel:+918076146988"
                className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
              >
                <Phone size={22} />
                Call Karo Abhi
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Table — FD vs Gold vs Land */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
              Kahan Invest Karein? <span className="text-[#D4AF37]">Khud Dekho</span>
            </h2>
            <p className="text-gray-600 text-lg">Aapke paise kahan sabse zyada badhenge?</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-2xl shadow-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#0F3A5F] text-white">
                    <th className="py-4 px-4 md:px-6 text-left font-bold">Investment</th>
                    <th className="py-4 px-4 md:px-6 text-center font-bold">Return</th>
                    <th className="py-4 px-4 md:px-6 text-center font-bold">Risk</th>
                    <th className="py-4 px-4 md:px-6 text-center font-bold hidden sm:table-cell">Tension</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 md:px-6 font-semibold text-gray-700">🏦 FD (Bank)</td>
                    <td className="py-4 px-4 md:px-6 text-center text-red-500 font-bold">6-7%</td>
                    <td className="py-4 px-4 md:px-6 text-center text-yellow-500">Low</td>
                    <td className="py-4 px-4 md:px-6 text-center hidden sm:table-cell text-gray-600">Tax katega</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 md:px-6 font-semibold text-gray-700">📈 Share Market</td>
                    <td className="py-4 px-4 md:px-6 text-center text-orange-500 font-bold">12-15%*</td>
                    <td className="py-4 px-4 md:px-6 text-center text-red-500 font-bold">High</td>
                    <td className="py-4 px-4 md:px-6 text-center hidden sm:table-cell text-gray-600">Roz ka stress</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-4 md:px-6 font-semibold text-gray-700">🪙 Gold</td>
                    <td className="py-4 px-4 md:px-6 text-center text-yellow-600 font-bold">8-10%</td>
                    <td className="py-4 px-4 md:px-6 text-center text-yellow-500">Medium</td>
                    <td className="py-4 px-4 md:px-6 text-center hidden sm:table-cell text-gray-600">Locker chahiye</td>
                  </tr>
                  <tr className="bg-green-50 border-2 border-green-400">
                    <td className="py-4 px-4 md:px-6 font-bold text-green-700">🏗️ Zameen (Land)</td>
                    <td className="py-4 px-4 md:px-6 text-center text-green-600 font-bold text-lg">15-20%</td>
                    <td className="py-4 px-4 md:px-6 text-center text-green-600 font-bold">Lowest</td>
                    <td className="py-4 px-4 md:px-6 text-center hidden sm:table-cell text-green-600 font-semibold">Chain ki neend</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-400 mt-3 text-center">*Share market returns fluctuate, land values have consistently risen in Mathura-Vrindavan corridor</p>
          </div>
        </div>
      </section>

      {/* Emotional Triggers — Why NOW */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
              Abhi Kyun? <span className="text-[#D4AF37]">Kal Bohot Late Hoga</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: TrendingUp,
                title: 'Rate Har Quarter Badh Rahi Hai',
                content: 'Mathura-Vrindavan corridor mein land rates pichle 3 saal mein 40%+ badh chuke hain. Aaj ki rate kal nahi milegi.',
                color: 'text-red-500',
                bg: 'bg-red-50'
              },
              {
                icon: Building,
                title: 'Airport & Expressway Aa Raha Hai',
                content: 'Noida International Airport, Yamuna Expressway, aur new highways — ye sab aapki zameen ki value double karenge.',
                color: 'text-blue-500',
                bg: 'bg-blue-50'
              },
              {
                icon: Users,
                title: '15,000+ Parivar Pehle Se Trust Karte Hain',
                content: '2012 se Fanbe Group ke saath 15,000 se zyada families ne invest kiya hai. Aap akele nahi ho.',
                color: 'text-green-500',
                bg: 'bg-green-50'
              },
              {
                icon: IndianRupee,
                title: 'Phone Ki EMI Se Bhi Kam',
                content: `₹${lowestEmi.toLocaleString('en-IN')}/month — itni EMI toh aap phone ke liye dete ho. Yahan zameen milegi apne naam.`,
                color: 'text-purple-500',
                bg: 'bg-purple-50'
              },
              {
                icon: ShieldCheck,
                title: '100% Clear Title — Koi Jhanjhat Nahi',
                content: 'Registry turant, mutation turant, saare papers clear. Koi court case nahi, koi dispute nahi. Full tension-free.',
                color: 'text-emerald-500',
                bg: 'bg-emerald-50'
              },
              {
                icon: Clock,
                title: 'Limited Plots Bache Hain',
                content: 'Hamare popular projects mein 70-80% plots bik chuke hain. Jo soch rahe hain, woh reh jayenge.',
                color: 'text-orange-500',
                bg: 'bg-orange-50'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`${item.bg} rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bg} ${item.color} mb-4`}>
                  <item.icon size={26} />
                </div>
                <h3 className="text-lg font-bold text-[#2C2C2C] mb-2">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* EMI Breakdown — "Itna Sasta?" */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-[#0F3A5F] to-[#1a5a8f] text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              Sochiye... <span className="text-[#D4AF37]">Itna Easy Hai!</span>
            </h2>
            <p className="text-blue-200 text-lg">50 Gaj plot ka example dekhiye</p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-sm text-blue-200 mb-1">Step 1: Booking Amount</div>
                  <div className="text-3xl md:text-4xl font-bold text-[#D4AF37]">{formatPrice(lowestBooking)}</div>
                  <div className="text-blue-200 text-sm mt-1">Bas itna do, plot aapka</div>
                </div>
                <div className="md:border-x border-white/10 md:px-6">
                  <div className="text-sm text-blue-200 mb-1">Step 2: Monthly EMI</div>
                  <div className="text-3xl md:text-4xl font-bold text-[#D4AF37]">₹{lowestEmi.toLocaleString('en-IN')}</div>
                  <div className="text-blue-200 text-sm mt-1">0% Interest, {longestEmi} months</div>
                </div>
                <div>
                  <div className="text-sm text-blue-200 mb-1">Result</div>
                  <div className="text-3xl md:text-4xl font-bold text-green-400">Apna Plot!</div>
                  <div className="text-blue-200 text-sm mt-1">Registry + Mutation ready</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-green-300"><CheckCircle size={16} /> 0% Interest</span>
                  <span className="flex items-center gap-1.5 text-green-300"><CheckCircle size={16} /> No Hidden Charges</span>
                  <span className="flex items-center gap-1.5 text-green-300"><CheckCircle size={16} /> Turant Registry</span>
                  <span className="flex items-center gap-1.5 text-green-300"><CheckCircle size={16} /> Clear Title</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-blue-200 text-base">
                ₹{lowestEmi.toLocaleString('en-IN')}/month — <strong className="text-white">Phone ki EMI se bhi kam mein apne naam zameen!</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* All 6 Projects — Real Prices */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
              Apna Project Chuniye — <span className="text-[#D4AF37]">6 Options</span>
            </h2>
            <p className="text-gray-600 text-lg">Har budget ke liye, har zarurat ke liye</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {projectsData.slice(0, showAllProjects ? 6 : 3).map((project, idx) => (
              <motion.div
                key={project.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all group"
              >
                {/* Project Image */}
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={project.heroImage}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { if (e.target.src !== project.logo) e.target.src = project.logo; }}
                  />
                  <div className="absolute top-3 right-3 bg-[#D4AF37] text-[#0F3A5F] px-3 py-1 rounded-full text-xs font-bold">
                    {project.emiInterest} Interest
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-[#0F3A5F] mb-1">{project.title}</h3>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                    <MapPin size={14} /> {project.location}
                  </p>

                  {/* Price Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">Rate</div>
                      <div className="text-lg font-bold text-[#0F3A5F]">₹{project.pricePerSqYard.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-400">per sq yard</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-500">EMI From</div>
                      <div className="text-lg font-bold text-green-600">₹{project.pricing[0].emi.toLocaleString('en-IN')}</div>
                      <div className="text-xs text-gray-400">{project.emiMonths} months</div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3 text-center mb-4">
                    <span className="text-sm text-gray-600">Booking sirf </span>
                    <span className="text-lg font-bold text-[#D4AF37]">₹{project.pricing[0].booking.toLocaleString('en-IN')}</span>
                    <span className="text-sm text-gray-600"> ({project.bookingPercentage})</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/projects/${project.slug}`}
                      className="flex-1 bg-[#0F3A5F] hover:bg-[#0d2f4d] text-white py-2.5 rounded-lg font-semibold text-sm text-center transition-colors flex items-center justify-center gap-1"
                    >
                      Details <ArrowRight size={14} />
                    </Link>
                    <a
                      href={project.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg transition-colors"
                    >
                      <MessageCircle size={18} />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {!showAllProjects && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllProjects(true)}
                className="bg-gray-100 hover:bg-gray-200 text-[#0F3A5F] px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto"
              >
                Saare 6 Projects Dekhein <ChevronDown size={18} />
              </button>
            </div>
          )}
          {showAllProjects && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllProjects(false)}
                className="bg-gray-100 hover:bg-gray-200 text-[#0F3A5F] px-8 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 mx-auto"
              >
                Kam Dekhein <ChevronUp size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
              Kyun Karein Fanbe Group Pe <span className="text-[#D4AF37]">Bharosa?</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            {[
              { number: '2012', label: 'Se Kaam Kar Rahe Hain', sub: '13+ Years Experience' },
              { number: '25+', label: 'Projects Delivered', sub: 'All Over North India' },
              { number: '15,000+', label: 'Khush Parivar', sub: 'Families Trust Us' },
              { number: '100%', label: 'Legal Clarity', sub: 'No Disputes Ever' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-md border border-gray-100"
              >
                <div className="text-2xl md:text-3xl font-bold text-[#0F3A5F] mb-1">{stat.number}</div>
                <div className="text-sm font-semibold text-gray-700">{stat.label}</div>
                <div className="text-xs text-gray-400 mt-1">{stat.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Trust Points */}
          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              'Registry turant — aapke naam, aapki zameen',
              'Mutation same day — koi waiting nahi',
              '0% interest EMI — bank se bhi sasta',
              'No hidden charges — jo bola, wahi lagega',
              'Gated colony — family ke liye safe',
              'NH2 / Highway pe — value guaranteed badhegi'
            ].map((point, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                <span className="text-gray-700 font-medium text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emotional Close — Renting vs Owning */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Without Land */}
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 md:p-8">
                  <h3 className="text-xl font-bold text-red-600 mb-4">Bina Zameen Ke...</h3>
                  <ul className="space-y-3">
                    {[
                      'Zindagi bhar kiraya dete raho',
                      'Bachche ke naam kuch nahi',
                      'Old age mein koi security nahi',
                      'Paisa FD mein sadta rehta hai',
                      'Mehangai ke saath value ghatti hai'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-red-700">
                        <span className="text-red-400 mt-0.5">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* With Land */}
                <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 md:p-8">
                  <h3 className="text-xl font-bold text-green-700 mb-4">Zameen Lene Ke Baad...</h3>
                  <ul className="space-y-3">
                    {[
                      'Apni zameen, apna maalik',
                      'Bachche ke future ke liye asset',
                      'Retirement mein chain ki neend',
                      'Value har saal 15-20% badhti hai',
                      'Kabhi bhi becho, kabhi bhi banao'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-green-700">
                        <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA — Strong Push */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-[#0F3A5F] to-[#1a5a8f] text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Sochna Band Karo, <span className="text-[#D4AF37]">Karna Shuru Karo</span>
            </h2>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-4">
              Jo log 5 saal pehle zameen le chuke hain, aaj unki value double ho chuki hai.
            </p>
            <p className="text-white text-xl font-bold max-w-2xl mx-auto mb-8">
              Agle 5 saal baad aap pachtaoge ya khush hoge — <span className="text-[#D4AF37]">ye aaj decide hoga.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <a
                href="https://wa.me/918076146988?text=Mujhe%20plot%20book%20karna%20hai%20-%20details%20bhejo"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 hover:bg-green-600 text-white px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
              >
                <MessageCircle size={22} />
                Abhi WhatsApp Karo
              </a>
              <a
                href="tel:+918076146988"
                className="bg-white hover:bg-gray-100 text-[#0F3A5F] px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
              >
                <Phone size={22} />
                Direct Call Karo
              </a>
              {onBookSiteVisit && (
                <button
                  onClick={onBookSiteVisit}
                  className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
                >
                  <Award size={22} />
                  Site Visit Book Karo
                </button>
              )}
            </div>

            <p className="text-blue-300 text-sm">
              Free site visit available &bull; No charges for consultation &bull; Same day response guaranteed
            </p>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default WhyInvestPage;
