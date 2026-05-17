import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Shield, Target, Users, TrendingUp, MapPin, Phone, MessageCircle,
  CheckCircle, ArrowRight, IndianRupee, Award, Building, Clock,
  ShieldCheck, FileCheck, Heart, Star, Home
} from 'lucide-react';
import { projectsData } from '@/data/projectsData';

const AboutPage = () => {
  const lowestPrice = Math.min(...projectsData.map(p => p.pricePerSqYard));
  const lowestBooking = Math.min(...projectsData.map(p => p.pricing[0].booking));
  const lowestEmi = Math.min(...projectsData.map(p => p.pricing[0].emi));
  const totalProjects = projectsData.length;

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
        <title>Fanbe Group Ke Baare Mein | 12+ Years Trust | 15,000+ Khush Parivar</title>
        <meta name="description" content="Fanbe Group - 2012 se India ke bharose ka naam. 25+ projects, 15,000+ families, 100% legal clarity. Mathura, Vrindavan, Kosi Kalan, Sikar mein affordable plots." />
      </Helmet>

      {/* Hero — Emotional Identity */}
      <section className="bg-gradient-to-b from-[#0F3A5F] via-[#0F3A5F] to-[#1a5a8f] py-16 md:py-24 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-40 h-40 border border-white/20 rounded-full" />
          <div className="absolute bottom-20 right-10 w-60 h-60 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/10 rounded-full" />
        </div>
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-[#D4AF37]/20 border border-[#D4AF37]/40 rounded-full px-6 py-2 mb-6">
              <span className="text-[#D4AF37] font-semibold text-sm">Since 2012 &bull; Trusted by 15,000+ Families</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Hum Sirf Plot Nahi Bechte,<br />
              <span className="text-[#D4AF37]">Bharosa Bechte Hain</span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto mb-4">
              Jab aap Fanbe Group se zameen lete ho, toh aapko sirf registry nahi milti —
            </p>
            <p className="text-white text-xl md:text-2xl font-bold max-w-3xl mx-auto mb-8">
              Milta hai <span className="text-[#D4AF37]">chain ka sukoon</span>, <span className="text-[#D4AF37]">legal clarity</span>, aur <span className="text-[#D4AF37]">apno ka future</span>.
            </p>

            {/* Trust Numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">12+</div>
                <div className="text-gray-300 text-sm mt-1">Saal Ka Experience</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">25+</div>
                <div className="text-gray-300 text-sm mt-1">Projects Delivered</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">15,000+</div>
                <div className="text-gray-300 text-sm mt-1">Khush Parivar</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-[#D4AF37]">100%</div>
                <div className="text-gray-300 text-sm mt-1">Legal Clarity</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/918076146988?text=Fanbe%20Group%20ke%20baare%20mein%20jaankari%20chahiye"
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

      {/* Hamari Kahani — Our Story in Hindi */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
              Hamari Kahani — <span className="text-[#D4AF37]">Aapki Apni Kahani</span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-6 md:p-8 border border-blue-100">
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                <strong className="text-[#0F3A5F]">2012 mein ek sapna tha</strong> — ki har middle-class parivar ke paas apni zameen ho.
                Bank FD mein paisa sadta rehta hai, gold mein tension hoti hai, share market mein roz ka stress —
                <strong> lekin zameen? Woh kabhi doobti nahi.</strong>
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                Is soch ke saath <strong className="text-[#0F3A5F]">Fanbe Group</strong> shuru hua. Pehle ek project, phir doosra, phir teesra —
                aaj <strong className="text-[#D4AF37]">25+ projects</strong> deliver ho chuke hain. <strong className="text-[#D4AF37]">15,000 se zyada families</strong> ne
                humpe bharosa kiya aur aaj unki zameen ki value <strong>2x-3x</strong> ho chuki hai.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Humne kabhi shortcut nahi liya. <strong className="text-[#0F3A5F]">100% clear title, turant registry, turant mutation</strong> —
                yahi humari pehchaan hai. <strong>Isliye aaj Mathura, Vrindavan, Kosi Kalan aur Sikar mein
                log pehle Fanbe Group ka naam lete hain.</strong>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hum Kaise Alag Hain — Comparison */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
              Doosre Builder vs <span className="text-[#D4AF37]">Fanbe Group</span>
            </h2>
            <p className="text-gray-600 text-lg">Fark sirf dekhne se samajh aata hai</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Other Builders */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 md:p-8"
              >
                <h3 className="text-xl font-bold text-red-600 mb-5 flex items-center gap-2">
                  <span className="text-2xl">⚠️</span> Doosre Builder...
                </h3>
                <ul className="space-y-3">
                  {[
                    'Registry mein 6 mahine ka wait',
                    'Hidden charges baad mein pata chalte hain',
                    'Title clear nahi — court case ka risk',
                    'Narrow roads, no security, no planning',
                    'EMI pe interest lete hain',
                    'Phone uthana band ho jaata hai',
                    'Possession mein saalon ka delay',
                    'Koi mutation nahi milta'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-red-700">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Fanbe Group */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 md:p-8"
              >
                <h3 className="text-xl font-bold text-green-700 mb-5 flex items-center gap-2">
                  <span className="text-2xl">✅</span> Fanbe Group Mein...
                </h3>
                <ul className="space-y-3">
                  {[
                    'Turant registry — same day process',
                    'Zero hidden charges — jo bola wahi lagega',
                    '100% clear title — koi dispute nahi kabhi',
                    '30ft wide roads, CCTV, gated colony',
                    '0% interest EMI — bank se bhi sasta',
                    'Dedicated support — hamesha available',
                    'Instant possession — jab chaaho banao',
                    'Same day mutation — koi waiting nahi'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-green-700">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Hamara Approach — 4 Pillars */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
              Hum Kaam Kaise Karte Hain? <span className="text-[#D4AF37]">4 Pillars</span>
            </h2>
            <p className="text-gray-600 text-lg">In 4 cheezon pe humne kabhi compromise nahi kiya</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: MapPin,
                title: 'Sahi Location',
                hindi: 'NH2, Highway, Temple ke paas',
                content: 'Hum wahi zameen lete hain jahan aage value 100% badhegi — highways, mandir, railway station ke paas.',
                color: 'text-blue-500',
                bg: 'bg-blue-50'
              },
              {
                icon: ShieldCheck,
                title: '100% Legal',
                hindi: 'Clear title, zero dispute',
                content: '12 saal mein ek bhi court case nahi. Registry, mutation, sab kuch transparent aur immediate.',
                color: 'text-green-500',
                bg: 'bg-green-50'
              },
              {
                icon: Heart,
                title: 'Customer Pehle',
                hindi: 'Aap pehle, baaki baad mein',
                content: 'Inquiry se possession tak dedicated support. Phone karo toh turant jawab milega — yeh humara promise hai.',
                color: 'text-red-500',
                bg: 'bg-red-50'
              },
              {
                icon: TrendingUp,
                title: 'Value Badhna Pakka',
                hindi: '15-20% har saal appreciation',
                content: 'Mathura-Vrindavan corridor mein land rates pichle 3 saal mein 40%+ badh chuke hain. Aur badhenge.',
                color: 'text-purple-500',
                bg: 'bg-purple-50'
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
                <h3 className="text-lg font-bold text-[#2C2C2C] mb-1">{item.title}</h3>
                <p className="text-sm font-semibold text-[#D4AF37] mb-2">{item.hindi}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{item.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline */}
      <section className="py-16 md:py-20 bg-[#0F3A5F] text-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              Hamara Safar — <span className="text-[#D4AF37]">2012 Se Aaj Tak</span>
            </h2>
            <p className="text-blue-200 text-lg">Ek chhoti shuruaat se 15,000+ families ka bharosa</p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid gap-4 md:gap-6">
              {[
                {
                  year: '2012',
                  title: 'Shuruaat — Pehla Sapna',
                  desc: 'Ek sapna tha — ki har ghar mein zameen ho. Pehla project launch kiya Kosi Kalan, Mathura mein.',
                  highlight: false
                },
                {
                  year: '2014',
                  title: '5 Projects Complete',
                  desc: '2,000+ families ne bharosa kiya. Mathura-Vrindavan mein naam banna shuru hua.',
                  highlight: false
                },
                {
                  year: '2017',
                  title: '10+ Projects — Regional Leader',
                  desc: '5,000+ families. UP aur Rajasthan mein expand kiya. Khatu Shyam mein first project launch.',
                  highlight: false
                },
                {
                  year: '2020',
                  title: 'Pandemic Mein Bhi Delivery',
                  desc: 'Jab sab ruke the, humne projects deliver kiye. 10,000+ families ka bharosa aur majboot hua.',
                  highlight: false
                },
                {
                  year: '2024',
                  title: 'Premium Projects Launch',
                  desc: 'Brij Vatika (Vrindavan) aur Maa Semri Vatika (Mathura-Govardhan) — premium townships launch.',
                  highlight: false
                },
                {
                  year: 'Aaj',
                  title: '25+ Projects, 15,000+ Families',
                  desc: '6 active projects — Mathura, Vrindavan, Kosi Kalan, Sikar mein. Rate ₹7,525/sq yd se shuru.',
                  highlight: true
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex gap-4 md:gap-6 items-start ${item.highlight ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/40' : 'bg-white/10 border border-white/10'} rounded-xl p-4 md:p-6 backdrop-blur-sm`}
                >
                  <div className={`flex-shrink-0 w-16 md:w-20 text-center ${item.highlight ? 'bg-[#D4AF37] text-[#0F3A5F]' : 'bg-white/20'} rounded-lg py-2 px-1 font-bold text-sm md:text-base`}>
                    {item.year}
                  </div>
                  <div>
                    <h3 className={`font-bold text-base md:text-lg mb-1 ${item.highlight ? 'text-[#D4AF37]' : 'text-white'}`}>{item.title}</h3>
                    <p className="text-blue-200 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All 6 Projects — Quick View */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
              Hamare {totalProjects} Active Projects — <span className="text-[#D4AF37]">Apna Chuniye</span>
            </h2>
            <p className="text-gray-600 text-lg">Har budget ke liye, har zarurat ke liye — ₹{lowestPrice.toLocaleString('en-IN')}/sq yd se shuru</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {projectsData.map((project, idx) => (
              <motion.div
                key={project.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all group"
              >
                <div className="h-44 overflow-hidden relative">
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
                  <p className="text-gray-500 text-sm flex items-center gap-1 mb-3">
                    <MapPin size={14} /> {project.location}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Rate</div>
                      <div className="text-sm font-bold text-[#0F3A5F]">₹{project.pricePerSqYard.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">EMI</div>
                      <div className="text-sm font-bold text-green-600">₹{project.pricing[0].emi.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-gray-500">Booking</div>
                      <div className="text-sm font-bold text-[#D4AF37]">{formatPrice(project.pricing[0].booking)}</div>
                    </div>
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
              15,000 Families Galat Nahi Ho Sakti — <span className="text-[#D4AF37]">Humpe Bharosa Kyun?</span>
            </h2>
          </motion.div>

          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-4 mb-10">
            {[
              { icon: FileCheck, text: 'Registry turant — aapke naam, aapki zameen', color: 'text-blue-500' },
              { icon: ShieldCheck, text: 'Mutation same day — koi waiting nahi', color: 'text-green-500' },
              { icon: IndianRupee, text: '0% interest EMI — bank se bhi sasta', color: 'text-purple-500' },
              { icon: CheckCircle, text: 'No hidden charges — jo bola, wahi lagega', color: 'text-emerald-500' },
              { icon: Shield, text: 'Gated colony — family ke liye safe', color: 'text-blue-600' },
              { icon: TrendingUp, text: 'NH2 / Highway pe — value guaranteed badhegi', color: 'text-orange-500' },
              { icon: Award, text: '25+ projects successfully delivered', color: 'text-yellow-600' },
              { icon: Users, text: '15,000+ parivar pehle se jude hain', color: 'text-pink-500' }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <item.icon className={`${item.color} flex-shrink-0`} size={22} />
                <span className="text-gray-700 font-medium text-sm">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Emotional Close — Sapna vs Reality */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <h2 className="text-2xl md:text-4xl font-bold text-[#2C2C2C] mb-3">
                Sochiye... <span className="text-[#D4AF37]">5 Saal Baad Aap Kahan Honge?</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Without Fanbe */}
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 md:p-8">
                  <h3 className="text-xl font-bold text-red-600 mb-4">Agar Aaj Nahi Liya...</h3>
                  <ul className="space-y-3">
                    {[
                      'Rate aur badh jayegi — yeh toh tay hai',
                      'FD mein paisa sadta rahega (6% return)',
                      'Bachche bade honge, zameen nahi hogi',
                      'Retirement mein koi security nahi',
                      'Aap sochte rahoge, doosre le jayenge'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-red-700">
                        <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* With Fanbe */}
                <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 md:p-8">
                  <h3 className="text-xl font-bold text-green-700 mb-4">Agar Aaj Le Liya...</h3>
                  <ul className="space-y-3">
                    {[
                      'Aaj ki rate mein lock — kal mehnga hoga',
                      'Zameen ki value 2x-3x ho jayegi',
                      'Bachche ke naam permanent asset',
                      'Retirement mein chain ki neend',
                      'Kabhi bhi becho, kabhi bhi banao — FREEDOM'
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

            {/* Simple Math */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 md:p-8 border border-blue-100 text-center"
            >
              <h3 className="text-xl font-bold text-[#0F3A5F] mb-4">Simple Hisab Lagao</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Aaj Booking</div>
                  <div className="text-2xl md:text-3xl font-bold text-[#0F3A5F]">{formatPrice(lowestBooking)}</div>
                  <div className="text-xs text-gray-400">Sirf itna do, plot book</div>
                </div>
                <div className="hidden md:block text-4xl text-[#D4AF37] font-bold">→</div>
                <div className="md:hidden text-2xl text-[#D4AF37] font-bold">↓</div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">5 Saal Baad Value</div>
                  <div className="text-2xl md:text-3xl font-bold text-green-600">2x - 3x</div>
                  <div className="text-xs text-gray-400">Mathura-Vrindavan corridor growth</div>
                </div>
              </div>
              <p className="text-gray-600 mt-4 text-sm">
                EMI sirf <strong className="text-[#0F3A5F]">₹{lowestEmi.toLocaleString('en-IN')}/month</strong> — phone ki EMI se bhi kam mein <strong>apne naam zameen!</strong>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-[#0F3A5F] to-[#1a5a8f] text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Ab Aapki Baari Hai — <span className="text-[#D4AF37]">Apna Plot Chuniye</span>
            </h2>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-4">
              12 saal mein 15,000+ families ne humpe bharosa kiya — ab aapki baari hai.
            </p>
            <p className="text-white text-xl font-bold max-w-2xl mx-auto mb-8">
              Booking sirf <span className="text-[#D4AF37]">{formatPrice(lowestBooking)}</span> se shuru.
              EMI sirf <span className="text-[#D4AF37]">₹{lowestEmi.toLocaleString('en-IN')}/month</span>.
              <span className="text-[#D4AF37]"> 0% Interest.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <a
                href="https://wa.me/918076146988?text=Mujhe%20Fanbe%20Group%20ke%20projects%20ke%20baare%20mein%20details%20chahiye"
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
              <Link
                to="/why-invest"
                className="bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F3A5F] px-10 py-4 rounded-xl font-bold text-lg flex items-center gap-2 transition-all hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
              >
                <TrendingUp size={22} />
                Kyun Invest Karein?
              </Link>
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

export default AboutPage;
