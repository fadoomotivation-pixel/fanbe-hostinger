// ✅ PRICING CORRECTED - Feb 20, 2026, 8:07 PM IST
// All rates, EMI months, and pricing tables updated to match official payment plans
//
// OFFICIAL RATES (SOURCE OF TRUTH):
// Shree Kunj Bihari:    ₹8,025/sq yd | 60 months | 10% booking
// Khatu Shyam Enclave:  ₹7,525/sq yd | 60 months | 10% booking  
// Shree Jagannath Dham: ₹8,525/sq yd | 54 months | 10% booking
// Gokul Vatika:         ₹12,525/sq yd | 24 months | 10% booking
// Brij Vatika:          ₹15,525/sq yd | 40 months | 10% booking
// Maa Semri Vatika:     ₹15,525/sq yd | 24 months | 15% booking

export const projectsData = [
  {
    slug: 'shree-kunj-bihari',
    title: 'Shree Kunj Bihari Enclave',
    subline: 'Your Gateway to Divine Living in Vrindavan',
    heroImage: 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/shree-kunj-bihari/hero.jpg',
    logo: 'https://fanbegroup.com/logos/kunj-bihari-logo.png',
    overview: 'Experience premium living at Shree Kunj Bihari Enclave in Kosi Kalan, strategically located on NH2 near Mathura. This gated colony offers pollution-free environment, modern infrastructure, and flexible payment plans with 0% interest EMI. Perfect for residential plots and investment opportunities.',
    location: 'Kosi Kalan, Mathura, Uttar Pradesh',
    
    locationMarkers: [
      { icon: '🛣️', label: 'National Highway (NH2)', distance: '5 Minutes' },
      { icon: '🚆', label: 'Kosi Railway Station', distance: '5 Minutes' },
      { icon: '🛕', label: 'Shani Dev Mandir', distance: '5 Minutes' },
      { icon: '🛕', label: 'Nand Baba Mandir', distance: 'Nearby' },
      { icon: '🏭', label: 'Industrial Area', distance: 'Close Proximity' },
      { icon: '🏘️', label: 'Jagannath Dham', distance: 'Nearby Hub' },
      { icon: '🌳', label: 'Gokul Vatika', distance: 'Nearby Hub' }
    ],

    keyHighlights: [
      'Grand Entrance Gate with Guard Room',
      'Wide Damar (Blacktop) Roads inside colony',
      'Pollution-Free Green Environment',
      'Electricity & Water Supply Available',
      'Gated Colony with Closed Boundary',
      '100% Clear Title & Immediate Mutation',
      'Immediate Registry with 35% Payment',
      '0% Interest EMI - 60 Months Payment Plan'
    ],
    
    amenities: [
      { icon: 'Gate', label: 'Grand Entrance Gate', description: 'With Guard Room' },
      { icon: 'Road', label: 'Wide Roads', description: 'Damar (Blacktop) Roads' },
      { icon: 'Trees', label: 'Green Environment', description: 'Pollution-free, fresh air' },
      { icon: 'Zap', label: 'Basic Infrastructure', description: 'Electricity & Water supply' },
      { icon: 'Shield', label: 'Security', description: 'Gated Colony (Closed Boundary)' }
    ],

    investmentBenefits: [
      'High appreciation potential on NH2 corridor',
      'Strategic location near religious sites',
      'Growing industrial and commercial hub',
      'Excellent connectivity to Mathura & Agra',
      '100% Clear Title with immediate mutation',
      'No hidden charges - transparent pricing'
    ],
    
    pricePerSqYard: 8025,
    bookingPercentage: '10%',
    emiMonths: 60,
    emiInterest: '0%',
    registryPayment: '35%',

    pricing: [
      { size: 50, rate: 8025, total: 401250, booking: 40125, rest: 361125, emi: 6019 },
      { size: 55, rate: 8025, total: 441375, booking: 44137, rest: 397238, emi: 6621 },
      { size: 60, rate: 8025, total: 481500, booking: 48150, rest: 433350, emi: 7222 },
      { size: 80, rate: 8025, total: 642000, booking: 64200, rest: 577800, emi: 9630 },
      { size: 100, rate: 8025, total: 802500, booking: 80250, rest: 722250, emi: 12037 },
      { size: 120, rate: 8025, total: 963000, booking: 96300, rest: 866700, emi: 14445 },
      { size: 150, rate: 8025, total: 1203750, booking: 120375, rest: 1083375, emi: 18056 },
      { size: 200, rate: 8025, total: 1605000, booking: 160500, rest: 1444500, emi: 24075 },
      { size: 250, rate: 8025, total: 2006250, booking: 200625, rest: 1805625, emi: 30094 }
    ],

    trustBadges: [
      { icon: 'BadgeCheck', text: '100% Clear Title' },
      { icon: 'FileCheck', text: 'Immediate Mutation' },
      { icon: 'ShieldCheck', text: 'No Hidden Charges' },
      { icon: 'Receipt', text: '0% Interest EMI' }
    ],

    whatsappUrl: 'https://wa.me/918076146988?text=I%20am%20interested%20in%20Shree%20Kunj%20Bihari%20Enclave%20-%20Plots%20in%20Kosi%20Kalan',
    brochureUrl: '#',
    
    meta: {
      title: 'Shree Kunj Bihari Enclave - Plots in Kosi Kalan | Affordable Plots near Mathura NH2 | Fanbe Developers',
      description: 'Buy residential plots in Kosi Kalan on EMI at ₹8,025/sq yard. Located on NH2 near Mathura with 0% interest, immediate registry. Fanbe Developers premium gated colony.',
      keywords: 'Plots in Kosi Kalan, Land near Mathura NH2, Affordable plots in Mathura, Fanbe Developers projects, Residential plots on EMI in Kosi, Plots on National Highway, Gated colony Kosi Kalan'
    }
  },
  {
    slug: 'khatu-shyam-enclave',
    title: 'Khatu Shyam Enclave',
    subline: 'Divine Plots near Sacred Khatu Shyam Ji Mandir',
    heroImage: 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/khatu-shyam-enclave/hero.jpg',
    logo: 'https://fanbegroup.com/logos/khatu-shyam-logo.png',
    overview: 'Experience spiritual living at Khatu Shyam Enclave - a premium gated society located on the holy Khatu-Khachariawas Road in Sikar, Rajasthan. With the divine presence of Khatu Shyam Mandir and the emerging Shekhawati Film City, this location offers both spiritual peace and high investment potential. Our society features a grand temple, green park, water fountain, and highway-facing commercial shops.',
    location: 'Khatu-Khachariawas Road, Sikar, Rajasthan',
    
    quickStats: [
      { icon: '🛕', label: 'Khatu Shyam Mandir', distance: '20 Mins' },
      { icon: '🎬', label: 'Shekhawati Film City', distance: '15 Mins' },
      { icon: '🛡️', label: 'Gated Society', distance: '24/7 Security' }
    ],
    
    locationMarkers: [
      { icon: '🚩', label: 'Khatu Shyam Mandir', distance: '20 Minutes', description: 'Major pilgrimage site for millions of devotees' },
      { icon: '🏰', label: 'Jeen Mata Mandir', distance: '20 Minutes', description: '1200 years old ancient Shakti Peeth' },
      { icon: '🎥', label: 'Shekhawati Film City', distance: '15 Minutes', description: "Region's first film city with 10+ themes & Taj Mahal replica" }
    ],

    keyHighlights: [
      '20 Mins from Khatu Shyam Mandir - Major Pilgrimage Site',
      '15 Mins from Shekhawati Film City with 10+ Themes',
      '20 Mins from 1200-year-old Jeen Mata Mandir',
      'Gated Society with 24/7 Security Guards',
      'Grand Temple inside society for daily Aarti',
      'Water Fountain with color lighting at main crossing',
      'Highway-facing commercial shops for business income',
      '24/7 On-site Project Office for your service'
    ],
    
    premiumAmenities: [
      { 
        icon: '🛕', 
        label: 'Grand Temple', 
        description: 'Dedicated temple inside society for daily Aarti and spiritual peace',
        category: 'Spiritual'
      },
      { 
        icon: '🌳', 
        label: 'Green Park', 
        description: 'Open Gym, Walking Pathways, and Kids\' Playground',
        category: 'Lifestyle'
      },
      { 
        icon: '⛲', 
        label: 'Water Fountain', 
        description: 'Grand fountain with color lighting at main crossing (Chauraha)',
        category: 'Premium'
      },
      { 
        icon: '🛍️', 
        label: 'Market Place', 
        description: 'Highway-facing commercial shops for daily needs and business income',
        category: 'Commercial'
      },
      { 
        icon: '🏢', 
        label: '24/7 Project Office', 
        description: 'On-site office dedicated to your service',
        category: 'Service'
      }
    ],
    
    basicInfrastructure: [
      { icon: '✅', label: 'Gated Society', description: 'Walled Colony' },
      { icon: '✅', label: 'Wide Damar Roads', description: 'Blacktop Roads' },
      { icon: '✅', label: '24/7 Security Guards', description: 'Round-the-clock protection' },
      { icon: '✅', label: 'Water & Electricity', description: 'Continuous supply' },
      { icon: '✅', label: 'Waste Management', description: 'Clean environment system' }
    ],

    investmentBenefits: [
      'Shekhawati Film City bringing massive tourism growth',
      'Millions of devotees visit Khatu Shyam Ji annually',
      'Land rates skyrocketing in the region',
      'Perfect for Dharamshalas, Guest Houses, or Homes',
      'Highway-facing commercial shops for rental income',
      'Ancient pilgrimage circuit with Jeen Mata Mandir',
      'Stable and growth-oriented investment opportunity'
    ],
    
    investmentInsight: {
      title: 'Why Invest in Khatu Shyam Enclave?',
      content: 'With the new Shekhawati Film City bringing tourism and the eternal devotion of Khatu Shyam Ji bringing millions of visitors, land rates in this area are skyrocketing. Secure your plot today for a stable and growth-oriented future.'
    },
    
    pricePerSqYard: 7525,
    bookingPercentage: '10%',
    emiMonths: 60,
    emiInterest: '0%',
    registryPayment: '35%',
    
    pricing: [
      { size: 50, rate: 7525, total: 376250, booking: 37625, rest: 338625, emi: 5644 },
      { size: 55, rate: 7525, total: 413875, booking: 41387, rest: 372488, emi: 6208 },
      { size: 60, rate: 7525, total: 451500, booking: 45150, rest: 406350, emi: 6772 },
      { size: 80, rate: 7525, total: 602000, booking: 60200, rest: 541800, emi: 9030 },
      { size: 100, rate: 7525, total: 752500, booking: 75250, rest: 677250, emi: 11287 },
      { size: 120, rate: 7525, total: 903000, booking: 90300, rest: 812700, emi: 13545 },
      { size: 150, rate: 7525, total: 1128750, booking: 112875, rest: 1015875, emi: 16931 },
      { size: 200, rate: 7525, total: 1505000, booking: 150500, rest: 1354500, emi: 22575 },
      { size: 250, rate: 7525, total: 1881250, booking: 188125, rest: 1693125, emi: 28219 }
    ],
    
    trustBadges: [
      { icon: 'BadgeCheck', text: '100% Clear Title' },
      { icon: 'FileCheck', text: 'Immediate Registry' },
      { icon: 'ShieldCheck', text: 'Gated Security' },
      { icon: 'Receipt', text: 'Flexible EMI Plans' }
    ],

    whatsappUrl: 'https://wa.me/918076146988?text=I%20am%20interested%20in%20Khatu%20Shyam%20Enclave%20-%20Plots%20near%20Khatu%20Shyam%20Mandir',
    brochureUrl: '#',
    ctaTheme: 'saffron',
    
    meta: {
      title: 'Khatu Shyam Enclave - Plots near Khatu Shyam Mandir | Land for Sale in Sikar Rajasthan | Fanbe Developers',
      description: 'Buy residential plots near Khatu Shyam Mandir on Khachariawas Road, Sikar. 20 mins from temple, 15 mins from Shekhawati Film City. Gated society with temple, park, fountain. Investment plots near Jeen Mata Mandir.',
      keywords: 'Plots near Khatu Shyam Mandir, Land for sale in Sikar Rajasthan, Residential plots Khatu Khachariawas Road, Investment plots near Jeen Mata Mandir, Fanbe Developers Sikar projects, Gated society Khatu, Plots near Film City Rajasthan'
    }
  },
  {
    slug: 'brij-vatika',
    title: 'Brij Vatika',
    subline: 'Own Your Piece of Holy Braj – Premium Plots in Vrindavan',
    heroImage: 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/brij-vatika/hero.jpg',
    logo: 'https://fanbegroup.com/logos/brij-vatika-logo.png',
    overview: 'Experience premium living at Brij Vatika - a gated colony near holy Vrindavan. Located just 1 minute from NH2 and Ajhai Railway Station, and 5 minutes from the magnificent Golden Temple (Prem Mandir), this project offers 40-month EMI plan with 0% interest. Perfect for devotees and investors seeking proximity to Vrindavan\'s spiritual aura.',
    location: 'Near Ajhai Railway Station, Vrindavan Road, Mathura, UP',
    
    oneMinuteTimeline: [
      { icon: '🛣️', label: 'NH2 National Highway', time: '1 Minute', color: 'blue' },
      { icon: '🚆', label: 'Ajhai Railway Station', time: '1 Minute', color: 'green' },
      { icon: '🕌', label: 'Golden Temple (Prem Mandir)', time: '5 Minutes', color: 'gold' }
    ],
    
    locationMarkers: [
      { icon: '🛣️', label: 'NH2 Highway', distance: '1 Minute', description: 'Direct connectivity to Delhi, Agra, Mathura' },
      { icon: '🚆', label: 'Ajhai Railway Station', distance: '1 Minute', description: 'Major railway junction for pilgrims' },
      { icon: '🕌', label: 'Prem Mandir (Golden Temple)', distance: '5 Minutes', description: 'World-famous illuminated temple' },
      { icon: '🛕', label: 'Vrindavan Temples', distance: '10 Minutes', description: 'Banke Bihari, ISKCON temples' },
      { icon: '🛤️', label: 'Yamuna Expressway', distance: '15 Minutes', description: 'Fast connectivity to NCR region' }
    ],

    keyHighlights: [
      '1 Minute from NH2 - Fastest Highway Access',
      '1 Minute from Ajhai Railway Station',
      '5 Minutes from Prem Mandir (Golden Temple)',
      '10 Minutes from Vrindavan City Center',
      '40-Month EMI Plan - Longest Payment Window',
      '0% Interest - Most Affordable Payment Option',
      'Gated Colony with 24/7 Security',
      'Premium Location near Holy Vrindavan'
    ],
    
    emiHighlight: {
      title: '40-Month EMI Plan',
      subtitle: 'Longest & Most Flexible Payment Option',
      description: 'Pay in small monthly installments over 40 months with 0% interest. The most affordable way to own land near Vrindavan.'
    },

    investmentBenefits: [
      'Premium investment near Vrindavan',
      'Rapidly growing religious tourism hub',
      'NH2 location ensures high appreciation',
      'Perfect for retirement homes near temples',
      'Ajhai Station connectivity for easy travel',
      'Proximity to Prem Mandir attracts millions',
      '40-month EMI makes it affordable'
    ],
    
    pricePerSqYard: 15525,
    bookingPercentage: '10%',
    emiMonths: 40,
    emiInterest: '0%',
    registryPayment: '30%',
    
    pricing: [
      { size: 50, rate: 15525, total: 776250, booking: 77625, rest: 698625, emi: 17465 },
      { size: 60, rate: 15525, total: 931500, booking: 93150, rest: 838350, emi: 20958 },
      { size: 80, rate: 15525, total: 1242000, booking: 124200, rest: 1117800, emi: 27945 },
      { size: 100, rate: 15525, total: 1552500, booking: 155250, rest: 1397250, emi: 34931 },
      { size: 120, rate: 15525, total: 1863000, booking: 186300, rest: 1676700, emi: 41917 },
      { size: 150, rate: 15525, total: 2328750, booking: 232875, rest: 2095875, emi: 52396 },
      { size: 200, rate: 15525, total: 3105000, booking: 310500, rest: 2794500, emi: 69862 }
    ],
    
    trustBadges: [
      { icon: 'BadgeCheck', text: '40-Month EMI' },
      { icon: 'FileCheck', text: '0% Interest' },
      { icon: 'ShieldCheck', text: 'Clear Title' },
      { icon: 'Receipt', text: 'Premium Value' }
    ],

    whatsappUrl: 'https://wa.me/918076146988?text=I%20am%20interested%20in%20Brij%20Vatika%20-%20Plots%20near%20Vrindavan%20Prem%20Mandir',
    brochureUrl: '#',
    
    meta: {
      title: 'Brij Vatika - Residential Plots in Vrindavan near Prem Mandir | Plots near Ajhai Railway Station | Property for Sale Mathura Vrindavan',
      description: 'Looking for premium plots in Vrindavan? Brij Vatika offers gated colony plots with 0% interest EMI just 1 minute from Ajhai Station. 5 mins from Prem Mandir. 40-month payment plan. Book your site visit now!',
      keywords: 'Residential plots in Vrindavan near Prem Mandir, Plots near Ajhai Railway Station, Property for sale in Mathura Vrindavan, Premium plots Vrindavan, Gated colony near Golden Temple, Land near NH2 Vrindavan, 40 month EMI plots Mathura'
    }
  },
  {
    slug: 'jagannath-dham',
    title: 'Shree Jagannath Dham',
    subline: 'Affordable Gated Colony Plots in Kosi with Immediate Registry',
    heroImage: 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/jagannath-dham/hero.jpg',
    logo: 'https://fanbegroup.com/logos/jagannath-dham-logo.png',
    overview: 'Own your home at Shree Jagannath Dham! This gated colony offers immediate registry, instant possession, and affordable plots near Mathura. With 0% interest EMI and limited plots remaining, this is your opportunity to start building your future. All legal documents clear and ready for immediate mutation.',
    location: 'Kosi Kalan, Mathura, Uttar Pradesh',
    
    urgencyBanner: {
      text: 'Limited Plots Remaining',
      percentage: 78,
      message: '78% Already Sold - Only Few Plots Left!'
    },
    
    quickStats: [
      { icon: '💰', label: 'Affordable Price', distance: 'Guaranteed' },
      { icon: '📝', label: 'Immediate Registry', distance: 'Same Day' },
      { icon: '🏠', label: 'Instant Possession', distance: 'Ready Now' }
    ],
    
    locationMarkers: [
      { icon: '🛣️', label: 'NH2 Highway', distance: '3 Minutes', description: 'Direct access to national highway' },
      { icon: '🚆', label: 'Kosi Railway Station', distance: '5 Minutes', description: 'Major railway connectivity' },
      { icon: '🛕', label: 'Religious Sites', distance: 'Nearby', description: 'Multiple temples in vicinity' },
      { icon: '🏙️', label: 'Mathura City', distance: '15 Minutes', description: 'City center access' }
    ],

    keyHighlights: [
      'Affordable Gated Colony Plots in Kosi Mathura',
      'Immediate Registry - Get Documents Same Day',
      'Instant Possession - Start Building Immediately',
      '0% Interest EMI - Most Affordable Payment Plan',
      '100% Clear Title - All Legal Documents Ready',
      'Immediate Mutation - No Waiting Period',
      'Limited Plots Remaining - 78% Already Sold',
      'Stop Renting Forever - Own Your Land Today'
    ],
    
    legalDocuments: [
      { icon: '📄', label: 'Registry Documents', status: 'Available' },
      { icon: '📋', label: 'Mutation Papers', status: 'Ready' },
      { icon: '✅', label: 'Clear Title Deed', status: 'Verified' },
      { icon: '🏛️', label: 'Government Approved', status: 'Certified' }
    ],

    investmentBenefits: [
      'Affordable pricing for first-time buyers',
      'Immediate registry means instant ownership',
      'No waiting period for possession',
      'NH2 proximity ensures rapid appreciation',
      'Perfect for first-time land buyers',
      'Stop paying rent - invest in your future',
      'Limited availability creates urgency'
    ],
    
    pricePerSqYard: 8525,
    bookingPercentage: '10%',
    emiMonths: 54,
    emiInterest: '0%',
    registryPayment: '30%',

    pricing: [
      { size: 50, rate: 8525, total: 426250, booking: 42625, rest: 383625, emi: 7104 },
      { size: 55, rate: 8525, total: 468875, booking: 46887, rest: 421988, emi: 7814 },
      { size: 60, rate: 8525, total: 511500, booking: 51150, rest: 460350, emi: 8525 },
      { size: 80, rate: 8525, total: 682000, booking: 68200, rest: 613800, emi: 11366 },
      { size: 100, rate: 8525, total: 852500, booking: 85250, rest: 767250, emi: 14208 },
      { size: 120, rate: 8525, total: 1023000, booking: 102300, rest: 920700, emi: 17050 },
      { size: 150, rate: 8525, total: 1278750, booking: 127875, rest: 1150875, emi: 21312 },
      { size: 200, rate: 8525, total: 1705000, booking: 170500, rest: 1534500, emi: 28416 },
      { size: 250, rate: 8525, total: 2131250, booking: 213125, rest: 1918125, emi: 35520 }
    ],
    
    trustBadges: [
      { icon: 'BadgeCheck', text: 'Affordable Price' },
      { icon: 'FileCheck', text: 'Immediate Registry' },
      { icon: 'ShieldCheck', text: 'Instant Possession' },
      { icon: 'Receipt', text: '0% Interest' }
    ],

    whatsappUrl: 'https://wa.me/918076146988?text=I%20want%20to%20book%20a%20plot%20at%20Jagannath%20Dham%20-%20Plots%20in%20Kosi',
    brochureUrl: '#',
    ctaUrgent: true,
    
    meta: {
      title: 'Shree Jagannath Dham - Affordable Plots in Kosi Mathura | Immediate Registry Plots | Housing in Kosi Kalan',
      description: 'Own your home at Jagannath Dham. Gated colony plots with instant possession and registry. 0% interest EMI available. Limited plots remaining!',
      keywords: 'Affordable plots in Kosi Mathura, Immediate registry plots in Mathura, Housing Kosi Kalan, Gated colony Mathura, Plots with instant possession, Own land Kosi, Budget plots near NH2'
    }
  },
  {
    slug: 'gokul-vatika',
    title: 'Shree Gokul Vatika',
    subline: 'Professional Planning Meets World-Class Infrastructure',
    heroImage: 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/gokul-vatika/hero.jpg',
    logo: 'https://fanbegroup.com/logos/gokul-vatika-logo.png',
    overview: 'Experience the difference of professional township planning at Shree Gokul Vatika. Unlike ordinary colonies with narrow roads and no security, we offer 30ft wide blacktop roads, 24/7 CCTV surveillance, and complete infrastructure. Located strategically on NH2 near Mathura, this investment-grade gated community sets new standards for quality living. Every detail is professionally planned for your family\'s comfort and safety.',
    location: 'NH2, Near Mathura, Uttar Pradesh',
    
    quickStats: [
      { icon: '🛣️', label: '30ft Wide Roads', distance: 'Professional' },
      { icon: '📹', label: '24/7 CCTV', distance: 'Monitored' },
      { icon: '🏗️', label: 'Planned Layout', distance: 'Approved' }
    ],
    
    comparisonTable: {
      title: 'Why Gokul Vatika is Different',
      ordinaryColony: [
        { feature: 'Road Width', value: '10-15 ft narrow roads' },
        { feature: 'Security', value: 'No security system' },
        { feature: 'Planning', value: 'Random layout' },
        { feature: 'Infrastructure', value: 'Basic or missing' },
        { feature: 'Documentation', value: 'Delayed process' }
      ],
      gokulVatika: [
        { feature: 'Road Width', value: '30ft wide blacktop roads' },
        { feature: 'Security', value: '24/7 CCTV + Guards' },
        { feature: 'Planning', value: 'Professional township design' },
        { feature: 'Infrastructure', value: 'Complete modern amenities' },
        { feature: 'Documentation', value: '0% Interest EMI ready' }
      ]
    },
    
    locationMarkers: [
      { icon: '🛣️', label: 'NH2 National Highway', distance: '2 Minutes', description: 'Prime highway frontage location' },
      { icon: '🏙️', label: 'Mathura City Center', distance: '10 Minutes', description: 'All civic amenities nearby' },
      { icon: '✈️', label: 'Upcoming Airport', distance: '20 Minutes', description: 'Future connectivity boost' },
      { icon: '🛕', label: 'Gokul Temples', distance: '5 Minutes', description: 'Historic Krishna leela sites' },
      { icon: '🚄', label: 'Expressway Access', distance: '15 Minutes', description: 'Yamuna Expressway nearby' }
    ],

    keyHighlights: [
      '30ft Wide Blacktop Roads - Professional Infrastructure',
      '24/7 CCTV Surveillance - Complete Security Coverage',
      'Professionally Planned Layout - Government Approved',
      'Complete Underground Drainage System',
      'Street Lights on Every Road',
      'Grand Entrance Gate with Security Cabin',
      'Green Parks & Plantation Throughout',
      '0% Interest EMI - Investment Grade Property'
    ],
    
    infrastructureSpotlight: [
      { icon: '🛣️', label: '30ft Wide Roads', description: 'Blacktop roads wider than city standards', category: 'Roads' },
      { icon: '📹', label: 'CCTV Monitoring', description: '24/7 surveillance at all entry points', category: 'Security' },
      { icon: '🚧', label: 'Underground Drainage', description: 'Modern sewerage system installed', category: 'Sanitation' },
      { icon: '💡', label: 'Street Lighting', description: 'LED lights on every road', category: 'Lighting' },
      { icon: '🌳', label: 'Green Spaces', description: 'Parks and plantation zones', category: 'Environment' },
      { icon: '🚪', label: 'Grand Entry Gate', description: 'Impressive entrance with guard room', category: 'Amenity' }
    ],

    investmentBenefits: [
      'Investment-grade property with professional planning',
      'NH2 location ensures high appreciation potential',
      'Superior infrastructure compared to competitors',
      '30ft roads allow future commercial conversion',
      'CCTV security increases property value',
      'Government-approved layout gives legal safety',
      'Perfect for long-term wealth creation'
    ],
    
    pricePerSqYard: 12525,
    bookingPercentage: '10%',
    emiMonths: 24,
    emiInterest: '0%',
    registryPayment: '35%',

    pricing: [
      { size: 50, rate: 12525, total: 626250, booking: 62625, rest: 563625, emi: 23484 },
      { size: 55, rate: 12525, total: 688875, booking: 68887, rest: 619988, emi: 25832 },
      { size: 60, rate: 12525, total: 751500, booking: 75150, rest: 676350, emi: 28181 },
      { size: 80, rate: 12525, total: 1002000, booking: 100200, rest: 901800, emi: 37575 },
      { size: 100, rate: 12525, total: 1252500, booking: 125250, rest: 1127250, emi: 46968 },
      { size: 120, rate: 12525, total: 1503000, booking: 150300, rest: 1352700, emi: 56362 },
      { size: 150, rate: 12525, total: 1878750, booking: 187875, rest: 1690875, emi: 70453 },
      { size: 200, rate: 12525, total: 2505000, booking: 250500, rest: 2254500, emi: 93937 },
      { size: 250, rate: 12525, total: 3131250, booking: 313125, rest: 2818125, emi: 117421 }
    ],
    
    trustBadges: [
      { icon: 'BadgeCheck', text: '30ft Wide Roads' },
      { icon: 'FileCheck', text: 'CCTV Security' },
      { icon: 'ShieldCheck', text: 'Professional Planning' },
      { icon: 'Receipt', text: '0% Interest' }
    ],

    whatsappUrl: 'https://wa.me/918076146988?text=I%20am%20interested%20in%20Gokul%20Vatika%20-%20Investment%20Plots%20Mathura%20NH2',
    brochureUrl: '#',
    
    meta: {
      title: 'Shree Gokul Vatika - Investment Plots in Mathura near NH2 | Gated Community Plots Mathura | Fanbe Group',
      description: 'Invest in a future-ready gated society. Shree Gokul Vatika offers professionally planned residential plots with 30ft wide roads, 24/7 CCTV security, and complete infrastructure. Start your monthly EMI today.',
      keywords: 'Investment plots in Mathura near NH2, Gated community plots Mathura, Gokul Vatika Fanbe Group, 30ft wide road plots, CCTV gated colony Mathura, Professional township near Gokul, Plots on NH2 Mathura'
    }
  },
  {
    slug: 'maa-semri-vatika',
    title: 'Maa Semri Vatika',
    subline: 'A World-Class Township for Your Family - Elite Living in Holy Braj',
    heroImage: 'https://mfgjzkaabyltscgrkhdz.supabase.co/storage/v1/object/public/project-images/projects/maa-semri-vatika/hero.jpg',
    logo: 'https://fanbegroup.com/logos/maa-simri-vatika-logo.png',
    overview: 'Experience world-class township living at Maa Simri Vatika - the premium gated colony that redefines luxury in the holy land of Braj. Perfectly positioned at the center of Vrindavan, Mathura City, and Govardhan, this elite community offers grand entrance gates, lush green parks, and wide blacktop roads. With 24-month easy EMI and proximity to the sacred Maa Simri Mandir, this is where modern luxury meets spiritual peace.',
    location: 'Mathura-Govardhan Road, Near Maa Simri Mandir, UP',
    
    locationTriangle: [
      { icon: '🛕', label: 'Vrindavan', distance: '12 Minutes', direction: 'North' },
      { icon: '🏛️', label: 'Mathura City', distance: '10 Minutes', direction: 'West' },
      { icon: '⛰️', label: 'Govardhan', distance: '15 Minutes', direction: 'East' }
    ],
    
    quickStats: [
      { icon: '🌟', label: 'World-Class', distance: 'Premium' },
      { icon: '🏰', label: 'Elite Township', distance: 'Luxury' },
      { icon: '📅', label: '24-Month EMI', distance: 'Easy' }
    ],
    
    locationMarkers: [
      { icon: '🙏', label: 'Maa Simri Mandir', distance: '2 Minutes', description: 'Sacred temple with divine history' },
      { icon: '🛕', label: 'Vrindavan Temples', distance: '12 Minutes', description: 'All major Krishna temples' },
      { icon: '🏛️', label: 'Mathura City Center', distance: '10 Minutes', description: 'Shopping, hospitals, schools' },
      { icon: '⛰️', label: 'Govardhan Parikrama', distance: '15 Minutes', description: 'Holy pilgrimage circuit' },
      { icon: '🛣️', label: 'NH2 & Expressway', distance: '8 Minutes', description: 'Superior connectivity' }
    ],

    keyHighlights: [
      'World-Class Premium Township in Holy Braj',
      'Strategic Center Point: Vrindavan-Mathura-Govardhan',
      'Grand Entrance Gate with Architectural Excellence',
      'Lush Green Parks with Landscaped Gardens',
      'Wide Blacktop Roads (40ft Main, 30ft Internal)',
      'Premium Amenities - Club, Temple, Playground',
      'Elite Community Living - Best Families',
      '24-Month Easy EMI - Most Flexible Payment'
    ],
    
    premiumAmenities: [
      { 
        icon: '🏰', 
        label: 'Grand Entrance Gate', 
        description: 'Architecturally designed entrance with security cabin and decorative lighting',
        category: 'Premium'
      },
      { 
        icon: '🌳', 
        label: 'Lush Green Parks', 
        description: 'Professionally landscaped gardens with walking tracks and seating areas',
        category: 'Lifestyle'
      },
      { 
        icon: '🛣️', 
        label: 'Wide Blacktop Roads', 
        description: '40ft main roads and 30ft internal roads - wider than city standards',
        category: 'Infrastructure'
      },
      { 
        icon: '🏟️', 
        label: 'Community Club', 
        description: 'Modern clubhouse with indoor games and event space',
        category: 'Social'
      },
      { 
        icon: '🛕', 
        label: 'Temple Complex', 
        description: 'Beautiful temple inside society for daily prayers',
        category: 'Spiritual'
      },
      { 
        icon: '🎪', 
        label: 'Kids Playground', 
        description: 'Safe play area with modern equipment for children',
        category: 'Family'
      }
    ],

    investmentBenefits: [
      'Premium township attracts elite buyers',
      'Strategic triangle location ensures high demand',
      'World-class amenities command premium prices',
      'Religious tourism growing exponentially',
      'Perfect for luxury retirement homes',
      'Close to all three major pilgrimage sites',
      '24-month EMI makes luxury affordable'
    ],
    
    pricePerSqYard: 15525,
    bookingPercentage: '15%',
    emiMonths: 24,
    emiInterest: '0%',
    registryPayment: '40%',
    
    pricing: [
      { size: 60, rate: 15525, total: 931500, booking: 139725, rest: 791775, emi: 32990 },
      { size: 80, rate: 15525, total: 1242000, booking: 186300, rest: 1055700, emi: 43987 },
      { size: 100, rate: 15525, total: 1552500, booking: 232875, rest: 1319625, emi: 54984 },
      { size: 120, rate: 15525, total: 1863000, booking: 279450, rest: 1583550, emi: 65981 },
      { size: 150, rate: 15525, total: 2328750, booking: 349312, rest: 1979438, emi: 82476 },
      { size: 200, rate: 15525, total: 3105000, booking: 465750, rest: 2639250, emi: 109968 },
      { size: 250, rate: 15525, total: 3881250, booking: 582187, rest: 3299063, emi: 137460 }
    ],
    
    trustBadges: [
      { icon: 'BadgeCheck', text: 'World-Class' },
      { icon: 'FileCheck', text: 'Premium Township' },
      { icon: 'ShieldCheck', text: 'Elite Community' },
      { icon: 'Receipt', text: '24-Month EMI' }
    ],

    whatsappUrl: 'https://wa.me/918076146988?text=I%20am%20interested%20in%20Maa%20Simri%20Vatika%20-%20Luxury%20Plots%20near%20Vrindavan',
    brochureUrl: '#',
    ctaTheme: 'luxury',
    
    meta: {
      title: 'Maa Simri Vatika - Luxury Township Plots near Maa Simri Mandir | Plots on Mathura-Govardhan Road | Premium Gated Colony Vrindavan',
      description: 'Experience elite living at Maa Simri Vatika. A world-class gated township perfectly located near Maa Simri Mandir with easy access to Vrindavan and Mathura. Grand entrance, lush parks, 24-month easy EMI. Premium residential plots.',
      keywords: 'Luxury township plots near Maa Simri Mandir, Plots on Mathura-Govardhan road, Premium gated colony Vrindavan, World-class township Mathura, Elite residential plots Braj, Luxury plots near Govardhan, Premium society Mathura Vrindavan'
    }
  }
];