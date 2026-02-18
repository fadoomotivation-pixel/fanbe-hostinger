// ✅ RATES UPDATED — Feb 2026
// Shree Jagannath Dham       → ₹8,025/sq yd
// Shree Gokul Vatika         → ₹10,025/sq yd
// Brij Vatika (E Block)      → ₹15,525/sq yd
// Maa Semri Vatika           → ₹15,525/sq yd
// Shree Kunj Bihari Enclave  → ₹7,525/sq yd
// Shree Khatu Shyam Ji       → ₹7,525/sq yd

const projects = [
  {
    id: 'shree-kunj-bihari-enclave',
    name: 'Shree Kunj Bihari Enclave',
    location: 'Vrindavan, Uttar Pradesh',
    shortDescription: 'Premium residential plots in the holy city of Vrindavan',
    description: 'Experience divine living at Shree Kunj Bihari Enclave, located in the sacred land of Vrindavan. This premium residential project offers modern amenities while maintaining the spiritual essence of the region.',
    highlights: [
      'RERA Approved Project',
      'Immediate Registry Available',
      'Gated Community',
      'Wide Internal Roads',
      '24/7 Security',
      'Green Park & Garden'
    ],
    pricing: {
      startingPrice: '₹7,52,500',
      pricePerSqYd: '₹7,525',
      pricePerSqYdNum: 7525,
      plotSizes: ['100 sq yd', '150 sq yd', '200 sq yd', '250 sq yd']
    },
    amenities: [
      'Underground Electricity',
      'Street Lights',
      'Water Supply',
      'Drainage System',
      'Boundary Wall',
      'Main Gate with Security',
      'Children Play Area',
      'Community Hall',
      'Temple'
    ],
    paymentPlans: [
      {
        name: 'Standard Plan',
        downPayment: '35%',
        installments: '12 months interest-free',
        registryOn: '35% payment'
      },
      {
        name: 'Flexible Plan',
        downPayment: '25%',
        installments: '18 months',
        registryOn: '50% payment'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800',
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
    ],
    mapLocation: {
      lat: 27.5801,
      lng: 77.7000,
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=77.6900%2C27.5700%2C77.7100%2C27.5900&layer=mapnik'
    }
  },
  {
    id: 'shree-khatu-shyam-ji-enclave',
    name: 'Shree Khatu Shyam Ji Enclave',
    location: 'Khatu, Rajasthan',
    shortDescription: 'Spiritual living near the famous Khatu Shyam Temple',
    description: 'Shree Khatu Shyam Ji Enclave offers a unique blend of spirituality and modern living. Located near the revered Khatu Shyam Temple, this project is perfect for those seeking peace and prosperity.',
    highlights: [
      'Near Famous Khatu Shyam Temple',
      'RERA Registered',
      'Free Pick and Drop Facility',
      'No Hidden Charges',
      'Clear Title',
      'Investment & Residential Both'
    ],
    pricing: {
      startingPrice: '₹7,52,500',
      pricePerSqYd: '₹7,525',
      pricePerSqYdNum: 7525,
      plotSizes: ['100 sq yd', '150 sq yd', '200 sq yd']
    },
    amenities: [
      'Paved Roads',
      'Street Lighting',
      'Water Connection',
      'Electricity Connection',
      'Sewage System',
      'Landscaped Garden',
      'Security Guards',
      'CCTV Surveillance'
    ],
    paymentPlans: [
      {
        name: 'Quick Registry Plan',
        downPayment: '35%',
        installments: '10 months interest-free',
        registryOn: '35% payment'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'
    ],
    mapLocation: {
      lat: 27.3000,
      lng: 74.9500,
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=74.9400%2C27.2900%2C74.9600%2C27.3100&layer=mapnik'
    }
  },
  {
    id: 'shree-jagannath-dham',
    name: 'Shree Jagannath Dham',
    location: 'Mathura, Uttar Pradesh',
    shortDescription: 'Divine plots in the birthplace of Lord Krishna',
    description: 'Shree Jagannath Dham brings you closer to the divine in Mathura, the birthplace of Lord Krishna. This project combines spiritual significance with modern infrastructure for a complete living experience.',
    highlights: [
      'Prime Location in Mathura',
      'Approved Layout Plan',
      'Interest-Free Installments',
      'Immediate Possession',
      'Investment Opportunity',
      'Peaceful Environment'
    ],
    pricing: {
      startingPrice: '₹8,02,500',
      pricePerSqYd: '₹8,025',
      pricePerSqYdNum: 8025,
      plotSizes: ['100 sq yd', '150 sq yd', '200 sq yd', '250 sq yd']
    },
    amenities: [
      'Wide Roads - 40ft & 60ft',
      'Underground Cabling',
      'Street Lights',
      'Bore Water Supply',
      'Drainage System',
      'Park & Green Areas',
      'Community Center',
      '24x7 Security'
    ],
    paymentPlans: [
      {
        name: 'Premium Plan',
        downPayment: '40%',
        installments: '15 months interest-free',
        registryOn: '40% payment'
      },
      {
        name: 'Standard Plan',
        downPayment: '35%',
        installments: '12 months interest-free',
        registryOn: '35% payment'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800',
      'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800'
    ],
    mapLocation: {
      lat: 27.4924,
      lng: 77.6737,
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=77.6637%2C27.4824%2C77.6837%2C27.5024&layer=mapnik'
    }
  },
  {
    id: 'brij-vatika',
    name: 'Brij Vatika (E Block)',
    location: 'Braj Region, Uttar Pradesh',
    shortDescription: 'Premium E Block plots in the heart of Braj',
    description: 'Brij Vatika E Block offers you a chance to own a piece of the sacred Braj region. With modern amenities and traditional values, this project is ideal for both living and investment.',
    highlights: [
      'Located in Sacred Braj Region',
      'Fully Developed Infrastructure',
      'Clear Documentation',
      'Registry in 35% Payment',
      'No Brokerage',
      'Direct from Developer'
    ],
    pricing: {
      startingPrice: '₹15,52,500',
      pricePerSqYd: '₹15,525',
      pricePerSqYdNum: 15525,
      plotSizes: ['100 sq yd', '150 sq yd', '200 sq yd', '250 sq yd']
    },
    amenities: [
      'Concrete Roads',
      'Solar Street Lights',
      'RO Water Plant',
      'Electricity Meters',
      'Sewerage System',
      'Landscaping',
      'Children Park',
      'Security Cabin'
    ],
    paymentPlans: [
      {
        name: 'Easy Plan',
        downPayment: '30%',
        installments: '14 months interest-free',
        registryOn: '35% payment'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
    ],
    mapLocation: {
      lat: 27.5167,
      lng: 77.6833,
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=77.6733%2C27.5067%2C77.6933%2C27.5267&layer=mapnik'
    }
  },
  {
    id: 'shree-gokul-vatika',
    name: 'Shree Gokul Vatika',
    location: 'Gokul, Uttar Pradesh',
    shortDescription: 'Premium plots in Krishna\'s childhood abode',
    description: 'Shree Gokul Vatika is situated in Gokul, where Lord Krishna spent his childhood. This project offers premium residential plots with world-class facilities in a spiritually rich environment.',
    highlights: [
      'Near Gokul Temple',
      'Premium Gated Community',
      'RERA Certified',
      'Free Site Visit with Pick-Drop',
      'Best Price in Area',
      'High ROI Potential'
    ],
    pricing: {
      startingPrice: '₹10,02,500',
      pricePerSqYd: '₹10,025',
      pricePerSqYdNum: 10025,
      plotSizes: ['100 sq yd', '150 sq yd', '200 sq yd', '250 sq yd']
    },
    amenities: [
      '60ft Wide Main Road',
      'Interlocking Tile Roads',
      'LED Street Lights',
      'Underground Water Tank',
      'Electricity Connection',
      'Sewerage Line',
      'Meditation Center',
      'Jogging Track',
      'Gated Entry'
    ],
    paymentPlans: [
      {
        name: 'Standard Plan',
        downPayment: '35%',
        installments: '12 months interest-free',
        registryOn: '35% payment'
      },
      {
        name: 'Premium Plan',
        downPayment: '50%',
        installments: '6 months',
        registryOn: '50% payment'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800'
    ],
    mapLocation: {
      lat: 27.4400,
      lng: 77.7200,
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=77.7100%2C27.4300%2C77.7300%2C27.4500&layer=mapnik'
    }
  },
  {
    id: 'maa-semri-vatika',
    name: 'Maa Semri Vatika',
    location: 'Near Mathura, Uttar Pradesh',
    shortDescription: 'Premium plots with high appreciation potential',
    description: 'Maa Semri Vatika offers premium residential plots with excellent value appreciation potential. Perfect for first-time buyers and investors looking for strong ROI in the Mathura region.',
    highlights: [
      'High Appreciation Zone',
      'Near NH-2 Connectivity',
      'Approved by Local Authority',
      'Transparent Pricing',
      'No Extra Charges',
      'Quick Registry Process'
    ],
    pricing: {
      startingPrice: '₹15,52,500',
      pricePerSqYd: '₹15,525',
      pricePerSqYdNum: 15525,
      plotSizes: ['100 sq yd', '150 sq yd', '200 sq yd']
    },
    amenities: [
      'Paved Internal Roads',
      'Street Lighting',
      'Water Supply',
      'Electricity Poles',
      'Boundary Wall',
      'Main Gate',
      'Green Belt',
      'Open Spaces'
    ],
    paymentPlans: [
      {
        name: 'Affordable Plan',
        downPayment: '30%',
        installments: '15 months interest-free',
        registryOn: '35% payment'
      },
      {
        name: 'Quick Plan',
        downPayment: '40%',
        installments: '8 months',
        registryOn: '40% payment'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800',
      'https://images.unsplash.com/photo-1600566752734-114e4a19e0c8?w=800',
      'https://images.unsplash.com/photo-1600585154084-4e5fe7c39198?w=800'
    ],
    mapLocation: {
      lat: 27.5500,
      lng: 77.6500,
      embedUrl: 'https://www.openstreetmap.org/export/embed.html?bbox=77.6400%2C27.5400%2C77.6600%2C27.5600&layer=mapnik'
    }
  }
];

export default projects;
