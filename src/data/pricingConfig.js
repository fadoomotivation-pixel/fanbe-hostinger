/**
 * CENTRALIZED PRICING CONFIGURATION
 * =================================
 * 
 * This is the SINGLE SOURCE OF TRUTH for all project pricing.
 * All rates, EMI months, and payment plans are defined here.
 * 
 * ⚠️ CRITICAL: Any pricing changes must be made ONLY in this file!
 * 
 * Last Updated: February 20, 2026
 * Updated By: Pricing Audit Team
 */

// Helper function to calculate pricing table
function generatePricingTable(plotSizes, ratePerSqYd, bookingPercent, emiMonths) {
  return plotSizes.map(size => {
    const total = size * ratePerSqYd;
    const booking = Math.round(total * (bookingPercent / 100));
    const rest = total - booking;
    const emi = Math.round(rest / emiMonths);
    
    return {
      size,
      rate: ratePerSqYd,
      total,
      booking,
      rest,
      emi
    };
  });
}

// Official pricing data (as per payment plans)
export const PRICING_CONFIG = {
  'jagannath-dham': {
    projectName: 'Shree Jagannath Dham',
    pricePerSqYard: 8025,
    bookingPercentage: '10%',
    emiMonths: 54,
    emiInterest: '0%',
    registryPayment: '30%',
    plotSizes: [50, 55, 60, 80, 100, 120, 150, 200, 250]
  },
  'gokul-vatika': {
    projectName: 'Shree Gokul Vatika',
    pricePerSqYard: 10025,
    bookingPercentage: '10%',
    emiMonths: 24,
    emiInterest: '0%',
    registryPayment: '35%',
    plotSizes: [50, 55, 60, 80, 100, 120, 150, 200, 250]
  },
  'brij-vatika': {
    projectName: 'Brij Vatika',
    pricePerSqYard: 15525,
    bookingPercentage: '10%',
    emiMonths: 40,
    emiInterest: '0%',
    registryPayment: '30%',
    plotSizes: [50, 60, 80, 100, 120, 150, 200]
  },
  'maa-semri-vatika': {
    projectName: 'Maa Semri Vatika',
    pricePerSqYard: 15525,
    bookingPercentage: '15%',
    emiMonths: 24,
    emiInterest: '0%',
    registryPayment: '40%',
    plotSizes: [60, 80, 100, 120, 150, 200, 250]
  },
  'khatu-shyam-enclave': {
    projectName: 'Khatu Shyam Enclave',
    pricePerSqYard: 7525,
    bookingPercentage: '10%',
    emiMonths: 60,
    emiInterest: '0%',
    registryPayment: '35%',
    plotSizes: [50, 55, 60, 80, 100, 120, 150, 200, 250]
  },
  'shree-kunj-bihari': {
    projectName: 'Shree Kunj Bihari Enclave',
    pricePerSqYard: 7525,
    bookingPercentage: '10%',
    emiMonths: 60,
    emiInterest: '0%',
    registryPayment: '35%',
    plotSizes: [50, 55, 60, 80, 100, 120, 150, 200, 250]
  }
};

// Generate pricing tables for all projects
export const PROJECT_PRICING_TABLES = {
  'jagannath-dham': generatePricingTable(
    PRICING_CONFIG['jagannath-dham'].plotSizes,
    PRICING_CONFIG['jagannath-dham'].pricePerSqYard,
    parseFloat(PRICING_CONFIG['jagannath-dham'].bookingPercentage),
    PRICING_CONFIG['jagannath-dham'].emiMonths
  ),
  'gokul-vatika': generatePricingTable(
    PRICING_CONFIG['gokul-vatika'].plotSizes,
    PRICING_CONFIG['gokul-vatika'].pricePerSqYard,
    parseFloat(PRICING_CONFIG['gokul-vatika'].bookingPercentage),
    PRICING_CONFIG['gokul-vatika'].emiMonths
  ),
  'brij-vatika': generatePricingTable(
    PRICING_CONFIG['brij-vatika'].plotSizes,
    PRICING_CONFIG['brij-vatika'].pricePerSqYard,
    parseFloat(PRICING_CONFIG['brij-vatika'].bookingPercentage),
    PRICING_CONFIG['brij-vatika'].emiMonths
  ),
  'maa-semri-vatika': generatePricingTable(
    PRICING_CONFIG['maa-semri-vatika'].plotSizes,
    PRICING_CONFIG['maa-semri-vatika'].pricePerSqYard,
    parseFloat(PRICING_CONFIG['maa-semri-vatika'].bookingPercentage),
    PRICING_CONFIG['maa-semri-vatika'].emiMonths
  ),
  'khatu-shyam-enclave': generatePricingTable(
    PRICING_CONFIG['khatu-shyam-enclave'].plotSizes,
    PRICING_CONFIG['khatu-shyam-enclave'].pricePerSqYard,
    parseFloat(PRICING_CONFIG['khatu-shyam-enclave'].bookingPercentage),
    PRICING_CONFIG['khatu-shyam-enclave'].emiMonths
  ),
  'shree-kunj-bihari': generatePricingTable(
    PRICING_CONFIG['shree-kunj-bihari'].plotSizes,
    PRICING_CONFIG['shree-kunj-bihari'].pricePerSqYard,
    parseFloat(PRICING_CONFIG['shree-kunj-bihari'].bookingPercentage),
    PRICING_CONFIG['shree-kunj-bihari'].emiMonths
  )
};

// Quick lookup function
export function getPricingForProject(slug) {
  const config = PRICING_CONFIG[slug];
  if (!config) return null;
  
  return {
    ...config,
    pricing: PROJECT_PRICING_TABLES[slug]
  };
}

// Validation function to ensure pricing integrity
export function validatePricing() {
  const errors = [];
  
  Object.keys(PRICING_CONFIG).forEach(slug => {
    const config = PRICING_CONFIG[slug];
    
    if (!config.pricePerSqYard || config.pricePerSqYard <= 0) {
      errors.push(`${slug}: Invalid price per sq yard`);
    }
    
    if (!config.emiMonths || config.emiMonths <= 0) {
      errors.push(`${slug}: Invalid EMI months`);
    }
    
    if (!config.plotSizes || config.plotSizes.length === 0) {
      errors.push(`${slug}: No plot sizes defined`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export default PRICING_CONFIG;
