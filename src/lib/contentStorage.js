// Content storage for project data
const PROJECT_CONTENT_KEY = 'fanbe_project_content_';
const PRICING_TABLE_KEY = 'fanbe_pricing_table_';
const PROJECT_IMAGE_KEY = 'fanbe_project_images';
const PROJECT_DOCS_KEY = 'fanbe_project_docs_';
const PROJECT_MAP_KEY = 'fanbe_project_map_'; // NEW: For map URLs

// Save project content (overview, description, etc.)
export const saveProjectContent = (slug, content) => {
  try {
    localStorage.setItem(PROJECT_CONTENT_KEY + slug, JSON.stringify(content));
    return true;
  } catch (error) {
    console.error('Error saving project content:', error);
    return false;
  }
};

// Get project content
export const getProjectContent = (slug) => {
  try {
    const data = localStorage.getItem(PROJECT_CONTENT_KEY + slug);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading project content:', error);
    return null;
  }
};

// Save pricing table
export const savePricingTable = (slug, pricingData) => {
  try {
    localStorage.setItem(PRICING_TABLE_KEY + slug, JSON.stringify(pricingData));
    return true;
  } catch (error) {
    console.error('Error saving pricing table:', error);
    return false;
  }
};

// Get pricing table
export const getPricingTable = (slug) => {
  try {
    const data = localStorage.getItem(PRICING_TABLE_KEY + slug);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading pricing table:', error);
    return null;
  }
};

// Save project image to IndexedDB
export const saveProjectImageToDB = async (slug, imageDataUrl) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FanbeProjectImages', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      store.put({ slug, imageDataUrl, updatedAt: new Date().toISOString() });
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'slug' });
      }
    };
  });
};

// Get project image from IndexedDB
export const getProjectImageFromDB = async (slug) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FanbeProjectImages', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const getRequest = store.get(slug);
      
      getRequest.onsuccess = () => {
        resolve(getRequest.result?.imageDataUrl || null);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'slug' });
      }
    };
  });
};

// Get all project images
export const getProjectImagesFromDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FanbeProjectImages', 1);
    
    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      resolve({});
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        const images = {};
        getAllRequest.result.forEach(item => {
          images[item.slug] = item.imageDataUrl;
        });
        resolve(images);
      };
      
      getAllRequest.onerror = () => {
        console.error('Get all error:', getAllRequest.error);
        resolve({});
      };
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'slug' });
      }
    };
  });
};

// Save project documents (brochure, site map)
export const saveProjectDocs = async (slug, docs) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FanbeProjectDocs', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['docs'], 'readwrite');
      const store = transaction.objectStore('docs');
      
      store.put({ slug, ...docs, updatedAt: new Date().toISOString() });
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('docs')) {
        db.createObjectStore('docs', { keyPath: 'slug' });
      }
    };
  });
};

// Get project documents
export const getProjectDocs = async (slug) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FanbeProjectDocs', 1);
    
    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      resolve({ brochure: null, map: null });
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['docs'], 'readonly');
      const store = transaction.objectStore('docs');
      const getRequest = store.get(slug);
      
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        resolve({
          brochure: result?.brochure || null,
          map: result?.map || null
        });
      };
      
      getRequest.onerror = () => {
        console.error('Get docs error:', getRequest.error);
        resolve({ brochure: null, map: null });
      };
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('docs')) {
        db.createObjectStore('docs', { keyPath: 'slug' });
      }
    };
  });
};

// NEW: Save project map URL
export const saveProjectMapUrl = (slug, mapUrl) => {
  try {
    localStorage.setItem(PROJECT_MAP_KEY + slug, mapUrl);
    return true;
  } catch (error) {
    console.error('Error saving map URL:', error);
    return false;
  }
};

// NEW: Get project map URL
export const getProjectMapUrl = (slug) => {
  try {
    return localStorage.getItem(PROJECT_MAP_KEY + slug) || null;
  } catch (error) {
    console.error('Error loading map URL:', error);
    return null;
  }
};

// Clear all project data for a specific slug
export const clearProjectData = (slug) => {
  try {
    localStorage.removeItem(PROJECT_CONTENT_KEY + slug);
    localStorage.removeItem(PRICING_TABLE_KEY + slug);
    localStorage.removeItem(PROJECT_MAP_KEY + slug);
    return true;
  } catch (error) {
    console.error('Error clearing project data:', error);
    return false;
  }
};
