
// Real-time synchronization service for CRM and Frontend communication
import { setStorageData } from './contentSync';

// Event Names Constants
export const EVENTS = {
  SLIDER_UPDATED: 'slider_updated',
  PROJECT_IMAGE_UPDATED: 'project_image_updated',
  PROJECT_CONTENT_UPDATED: 'project_content_updated',
  MENU_UPDATED: 'menu_updated',
  HOMEPAGE_SETTINGS_UPDATED: 'homepage_settings_updated',
};

/**
 * Triggers a content update event across tabs and within the current window
 * @param {string} eventName - One of the EVENTS constants
 * @param {any} data - The data payload to send
 */
export const triggerContentUpdate = (eventName, data = {}) => {
  const payload = {
    event: eventName,
    data: data,
    timestamp: Date.now()
  };

  // 1. Trigger local storage event (for other tabs)
  // We use a specific key for sync events to avoid polluting main storage keys constantly
  try {
    localStorage.setItem('crm_sync_event', JSON.stringify(payload));
  } catch (e) {
    console.warn('LocalStorage event trigger failed', e);
  }

  // 2. Trigger custom window event (for current tab/window components)
  const customEvent = new CustomEvent(eventName, { detail: payload });
  window.dispatchEvent(customEvent);
  
  console.log(`[ContentSync] Triggered: ${eventName}`, payload);
};

/**
 * Subscribes to content update events
 * @param {string} eventName - One of the EVENTS constants
 * @param {function} callback - Function to run when event occurs
 * @returns {function} - Unsubscribe function
 */
export const subscribeToContentUpdates = (eventName, callback) => {
  // Handler for same-window events
  const windowHandler = (e) => {
    if (e.detail && e.detail.event === eventName) {
      callback(e.detail);
    }
  };

  // Handler for cross-tab events (via localStorage)
  const storageHandler = (e) => {
    if (e.key === 'crm_sync_event' && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload.event === eventName) {
          callback(payload);
        }
      } catch (err) {
        console.error('Error parsing sync event', err);
      }
    }
  };

  window.addEventListener(eventName, windowHandler);
  window.addEventListener('storage', storageHandler);

  // Return unsubscribe function
  return () => {
    window.removeEventListener(eventName, windowHandler);
    window.removeEventListener('storage', storageHandler);
  };
};
