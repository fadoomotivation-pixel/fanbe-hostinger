
import { projectsData } from '@/data/projectsData';
import { supabase } from '@/lib/supabase';

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
const DOCS_PREFIX = 'crm_project_docs_';

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
// PROJECT DOCUMENTS (Brochure & Map)
// ═════════════════════════════════════════════════════════════

export const getProjectDocs = (slug) => {
  try {
    const saved = localStorage.getItem(`${DOCS_PREFIX}${slug}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return { brochure: null, map: null };
  } catch (error) {
    console.error('Error fetching project docs:', error);
    return { brochure: null, map: null };
  }
};

export const saveProjectDocs = (slug, docs) => {
  try {
    const dataToSave = {
      ...docs,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(`${DOCS_PREFIX}${slug}`, JSON.stringify(dataToSave));
    return { success: true, timestamp: dataToSave.lastUpdated };
  } catch (error) {
    console.error('Error saving project docs:', error);
    return { success: false, error: error.message };
  }
};

export const getAllProjectDocs = () => {
  try {
    const allDocs = {};
    const projects = ['shree-kunj-bihari', 'khatu-shyam-enclave', 'jagannath-dham', 'brij-vatika', 'gokul-vatika', 'maa-simri-vatika'];
    projects.forEach(slug => {
      allDocs[slug] = getProjectDocs(slug);
    });
    return allDocs;
  } catch (error) {
    console.error('Error fetching all project docs:', error);
    return {};
  }
};
