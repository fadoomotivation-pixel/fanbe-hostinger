
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'whatsapp_config';
const DEFAULT_NUMBER = '8076146988'; // As per updated requirement

export const useWhatsApp = () => {
  const [phoneNumber, setPhoneNumber] = useState(DEFAULT_NUMBER);

  useEffect(() => {
    const loadConfig = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const config = JSON.parse(stored);
          if (config.number) {
            setPhoneNumber(config.number);
          }
        } catch (e) {
          console.error("Failed to parse WhatsApp config");
        }
      }
    };
    
    loadConfig();
    window.addEventListener('storage', loadConfig);
    return () => window.removeEventListener('storage', loadConfig);
  }, []);

  const updateNumber = (newNumber) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ number: newNumber }));
    setPhoneNumber(newNumber);
    // Dispatch storage event manually for same-tab sync
    window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: JSON.stringify({ number: newNumber })
    }));
  };

  const getWhatsAppLink = (message = '') => {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    const finalNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    return `https://wa.me/${finalNumber}?text=${encodeURIComponent(message)}`;
  };

  return { phoneNumber, updateNumber, getWhatsAppLink };
};
