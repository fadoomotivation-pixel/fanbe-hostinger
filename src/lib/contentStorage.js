
import { projectsData } from '@/data/projectsData';
import { supabase } from '@/lib/supabase';
import { getProjectDocuments } from '@/lib/documentStorage';

// Fetch image URLs saved by the CMS from the Supabase DB.
// Returns a map of { [slug]: heroImageUrl }
export const getProjectImagesFromDB = async () => {
  try {
    const { data, error } = await supabase
      .from('project_content')
      .select('slug, hero_image');
    if (error) throw error;
    return (data || []).reduce((acc, row) => {
      if (row.hero_image) acc[row.slug] = row.hero_image;
      return acc;
    }, {});
  } catch (err) {
    console.error('Error fetching project images from DB:', err);
    return {};
  }
};

const CONTENT_PREFIX = 'crm_project_content_';
const PRICING_PREFIX = 'crm_project_pricing_';

export const getProjectContent = (slug) => {
  try {
    const saved = localStorage.getItem(`${CONTENT_PREFIX}${slug}`);
    if (saved) {
      return JSON.parse(saved);
    }
    // Fallback to static data
    return projectsData.find(p => p.slug === slug) || null;
  } catch (error) {
    console.error('Error fetching project content:', error);
    return null;
  }
};

export const saveProjectContent = (slug, content) => {
  try {
    const dataToSave = {
      ...content,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`${CONTENT_PREFIX}${slug}`, JSON.stringify(dataToSave));
    return { success: true, timestamp: dataToSave.lastUpdated };
  } catch (error) {
    console.error('Error saving project content:', error);
    return { success: false, error: error.message };
  }
};

export const getPricingTable = (slug) => {
  try {
    const saved = localStorage.getItem(`${PRICING_PREFIX}${slug}`);
    if (saved) {
      return JSON.parse(saved);
    }
    // Fallback to static data pricing
    const project = projectsData.find(p => p.slug === slug);
    return project?.pricing || [];
  } catch (error) {
    console.error('Error fetching pricing table:', error);
    return [];
  }
};

export const savePricingTable = (slug, pricingData) => {
  try {
    const payload = {
      data: pricingData,
      lastUpdated: new Date().toISOString()
    };
    // Get history
    const current = getPricingTable(slug);
    const historyKey = `${PRICING_PREFIX}${slug}_history`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // Add to history (keep last 5)
    history.unshift({
      date: new Date().toISOString(),
      previousData: current
    });
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 5)));

    // Save new
    localStorage.setItem(`${PRICING_PREFIX}${slug}`, JSON.stringify(payload.data));
    
    return { success: true, timestamp: payload.lastUpdated };
  } catch (error) {
    console.error('Error saving pricing table:', error);
    return { success: false, error: error.message };
  }
};

// ═════════════════════════════════════════════════════════════
// PROJECT DOCUMENTS (Now using Supabase Cloud Storage)
// ═════════════════════════════════════════════════════════════

export const getProjectDocs = async (slug) => {
  try {
    // Fetch from Supabase cloud storage
    const docs = await getProjectDocuments(slug);
    
    // Convert to format expected by frontend
    const result = { brochure: null, map: null };
    
    if (docs.brochure) {
      result.brochure = {
        filename: docs.brochure.filename,
        data: docs.brochure.url, // URL instead of base64
        size: docs.brochure.size,
        type: docs.brochure.type,
        uploadedAt: docs.brochure.uploadedAt
      };
    }
    
    if (docs.map) {
      result.map = {
        filename: docs.map.filename,
        data: docs.map.url, // URL instead of base64
        size: docs.map.size,
        type: docs.map.type,
        uploadedAt: docs.map.uploadedAt
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching project docs:', error);
    return { brochure: null, map: null };
  }
};

// Deprecated - Documents now managed via Supabase
export const saveProjectDocs = () => {
  console.warn('saveProjectDocs is deprecated. Use uploadDocument from documentStorage.js');
  return { success: false, error: 'Use uploadDocument instead' };
};

export const getAllProjectDocs = () => {
  console.warn('getAllProjectDocs is deprecated. Use getAllProjectDocuments from documentStorage.js');
  return {};
};
