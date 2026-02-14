
import { useState, useEffect } from 'react';
import { projectsData } from '@/data/projectsData';

// Constants for LocalStorage Keys
export const KEYS = {
  HOMEPAGE_SETTINGS: 'cms_homepage_settings',
  SLIDER_DATA: 'cms_slider_data',
  NAV_MENU: 'cms_nav_menu',
  PROJECT_CONTENT_PREFIX: 'crm_project_content_', // Matches existing storage
  PROJECT_PRICING_PREFIX: 'crm_project_pricing_', // Matches existing storage
};

// Default Configurations
const DEFAULT_HOMEPAGE_SETTINGS = {
  toggles: {
    hero: true,
    emiCalculator: true,
    ourProjects: true,
    aboutUs: true,
    testimonials: true,
    contact: true
  },
  ourProjects: {
    title: "Our Projects",
    subtitle: "Explore our premium plotted developments designed for your spiritual and peaceful living.",
    bgColor: "#F5F5F5",
    padding: "Large", // Small, Medium, Large
    alignment: "Center", // Left, Center, Right
    cardSettings: {
      imageSize: "Large",
      textOverlay: true,
      hoverEffect: true,
      borderRadius: 12
    }
  }
};

const DEFAULT_SLIDER_DATA = {
  images: [
    { 
      id: 1, 
      url: 'https://images.unsplash.com/photo-1679931676577-b79a86e99bb7', 
      uploadDate: new Date().toISOString(), 
      isPrimary: true 
    }
  ],
  settings: {
    autoRotate: true,
    interval: 5000,
    transition: 'Fade'
  }
};

const DEFAULT_NAV_MENU = {
  items: [
    { id: 'home', label: 'Home', url: '/', position: 'header', visibility: 'public' },
    { id: 'about', label: 'About', url: '/about', position: 'header', visibility: 'public' },
    { id: 'projects', label: 'Projects', url: '/projects', position: 'header', visibility: 'public' },
    { id: 'why-invest', label: 'Why Invest', url: '/why-invest', position: 'header', visibility: 'public' },
    { id: 'contact', label: 'Contact', url: '/contact', position: 'header', visibility: 'public' }
  ],
  order: ['home', 'about', 'projects', 'why-invest', 'contact']
};

// --- Storage Helpers ---

export const getStorageData = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return fallback;
  }
};

export const setStorageData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch event for cross-component sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: key,
      newValue: JSON.stringify(data)
    }));
    return true;
  } catch (e) {
    console.error(`Error saving ${key}`, e);
    return false;
  }
};

// --- Hooks ---

export const useContentSync = (key, fallback) => {
  const [data, setData] = useState(() => getStorageData(key, fallback));

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key) {
        try {
          setData(JSON.parse(e.newValue));
        } catch (err) {
          // ignore parsing errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return data;
};

// Specific Hooks for Components
export const useHomepageSettings = () => useContentSync(KEYS.HOMEPAGE_SETTINGS, DEFAULT_HOMEPAGE_SETTINGS);
export const useSliderData = () => useContentSync(KEYS.SLIDER_DATA, DEFAULT_SLIDER_DATA);
export const useNavMenu = () => useContentSync(KEYS.NAV_MENU, DEFAULT_NAV_MENU);

// --- Admin Actions ---

export const updateHomepageSettings = (settings) => setStorageData(KEYS.HOMEPAGE_SETTINGS, settings);
export const updateSliderData = (data) => setStorageData(KEYS.SLIDER_DATA, data);
export const updateNavMenu = (menu) => setStorageData(KEYS.NAV_MENU, menu);
