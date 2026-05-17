import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

/**
 * Comprehensive SEO Component for Fanbe Group
 * 
 * Features:
 * - Schema.org structured data (JSON-LD)
 * - Open Graph meta tags
 * - Twitter Card meta tags
 * - Canonical URLs
 * - Brand name spelling variations
 * - Local business SEO
 * 
 * Usage:
 * <SEOHelmet 
 *   title="Page Title" 
 *   description="Page description" 
 *   type="website" // or "article", "product"
 *   image="/images/og-image.jpg" 
 * />
 */

const SEOHelmet = ({
  title,
  description,
  keywords = [],
  image = '/images/fanbe-og-default.jpg',
  type = 'website',
  projectData = null, // For project detail pages
  schemaType = 'WebPage', // WebPage, RealEstateListing, FAQPage
  children
}) => {
  const location = useLocation();
  const siteUrl = 'https://fanbegroup.com';
  const fullUrl = `${siteUrl}${location.pathname}`;
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  // ═══════════════════════════════════════════════════════════════════════
  // BRAND NAME VARIATIONS (for misspellings & search variations)
  // ═══════════════════════════════════════════════════════════════════════
  const brandVariations = [
    'Fanbe Group',
    'Fanbe Developers',
    'Fanbe India',
    'Fanbe Real Estate',
    'Fanbe Properties',
    // Common misspellings by illiterate/semi-literate users
    'Fanbe',
    'Fanbe grop',
    'Fanbe develper',
    'Fanbe devlopers',
    'Fanbe developer',
    'Fambe group',
    'Fambe developers',
    'Fanbe grup',
    'Phanbe group',
    'Phanbe developers',
    'Fanbe groups',
    'Fanbe property',
    'Fanbhe group',
    'Fanbe vrindavan',
    'Fanbe mathura',
    'Fanbe plots',
  ];

  // Combine with provided keywords
  const allKeywords = [
    ...brandVariations,
    ...keywords,
    'plots in vrindavan',
    'plots in mathura',
    'premium residential plots',
    '0% interest emi plots',
    'immediate registry plots',
  ].join(', ');

  // ═══════════════════════════════════════════════════════════════════════
  // ORGANIZATION SCHEMA (appears on every page)
  // ═══════════════════════════════════════════════════════════════════════
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${siteUrl}/#organization`,
    name: 'Fanbe Group',
    alternateName: brandVariations,
    url: siteUrl,
    logo: `${siteUrl}/images/fanbe-logo.png`,
    description: 'Premium residential plot developer in Vrindavan, Mathura & Rajasthan. Trusted by 15,000+ families since 2012.',
    foundingDate: '2012',
    telephone: '+91-8076146988',
    email: 'info@fanbegroup.com',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Vrindavan',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 27.5811,
      longitude: 77.6986
    },
    areaServed: [
      {
        '@type': 'City',
        name: 'Vrindavan'
      },
      {
        '@type': 'City',
        name: 'Mathura'
      },
      {
        '@type': 'City',
        name: 'Gokul'
      },
      {
        '@type': 'City',
        name: 'Khatu Shyam Ji'
      }
    ],
    sameAs: [
      'https://www.facebook.com/fanbegroup',
      'https://www.instagram.com/fanbegroup',
      'https://www.linkedin.com/company/fanbe-group'
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '15000',
      bestRating: '5',
      worstRating: '1'
    },
    priceRange: '₹₹',
    paymentAccepted: 'Cash, Bank Transfer, EMI',
    currenciesAccepted: 'INR'
  };

  // ═══════════════════════════════════════════════════════════════════════
  // WEBSITE SCHEMA
  // ═══════════════════════════════════════════════════════════════════════
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: 'Fanbe Group - Premium Plots in Vrindavan & Mathura',
    description: 'Premium residential plot projects in Vrindavan, Mathura & Rajasthan',
    publisher: {
      '@id': `${siteUrl}/#organization`
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/projects?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  // ═══════════════════════════════════════════════════════════════════════
  // BREADCRUMB SCHEMA
  // ═══════════════════════════════════════════════════════════════════════
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: siteUrl
    }
  ];

  pathParts.forEach((part, index) => {
    const position = index + 2;
    const url = `${siteUrl}/${pathParts.slice(0, index + 1).join('/')}`;
    const name = part.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    breadcrumbItems.push({
      '@type': 'ListItem',
      position,
      name,
      item: url
    });
  });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PROJECT-SPECIFIC SCHEMA (Real Estate Listing)
  // ═══════════════════════════════════════════════════════════════════════
  let projectSchema = null;
  if (projectData) {
    projectSchema = {
      '@context': 'https://schema.org',
      '@type': 'Residence',
      name: projectData.title,
      description: projectData.overview || projectData.subline,
      url: fullUrl,
      image: fullImageUrl,
      address: {
        '@type': 'PostalAddress',
        addressLocality: projectData.location.split(',')[0],
        addressRegion: projectData.location.includes('Rajasthan') ? 'Rajasthan' : 'Uttar Pradesh',
        addressCountry: 'IN'
      },
      geo: projectData.coordinates ? {
        '@type': 'GeoCoordinates',
        latitude: projectData.coordinates.lat,
        longitude: projectData.coordinates.lng
      } : undefined,
      offers: {
        '@type': 'Offer',
        price: projectData.pricePerSqYard || projectData.startingPrice,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: projectData.pricePerSqYard,
          priceCurrency: 'INR',
          unitText: 'per square yard'
        },
        seller: {
          '@id': `${siteUrl}/#organization`
        }
      },
      amenityFeature: projectData.keyHighlights?.map(highlight => ({
        '@type': 'LocationFeatureSpecification',
        name: highlight
      })),
      numberOfRooms: 'Land Plot',
      floorSize: {
        '@type': 'QuantitativeValue',
        value: '50-200',
        unitText: 'square yards'
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // COMBINE ALL SCHEMAS
  // ═══════════════════════════════════════════════════════════════════════
  const schemas = [organizationSchema, websiteSchema, breadcrumbSchema];
  if (projectSchema) schemas.push(projectSchema);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Fanbe Group" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="author" content="Fanbe Group" />
      <meta name="publisher" content="Fanbe Group" />
      <meta name="language" content="English, Hindi" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />

      {/* Geo Tags for Local SEO */}
      <meta name="geo.region" content="IN-UP" />
      <meta name="geo.placename" content="Vrindavan, Mathura" />
      <meta name="geo.position" content="27.5811;77.6986" />
      <meta name="ICBM" content="27.5811, 77.6986" />

      {/* Mobile Web App Tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="Fanbe Group" />

      {/* Schema.org Structured Data (JSON-LD) */}
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}

      {/* Additional child elements */}
      {children}
    </Helmet>
  );
};

export default SEOHelmet;
