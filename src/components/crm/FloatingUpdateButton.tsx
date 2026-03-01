// src/components/crm/FloatingUpdateButton.tsx
import React from 'react';
import { RefreshCw } from 'lucide-react';

interface FloatingUpdateButtonProps {
  onClick: () => void;
}

export default function FloatingUpdateButton({ onClick }: FloatingUpdateButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-110 active:scale-95 transition-all duration-200 animate-pulse"
      aria-label="Update Status"
    >
      <RefreshCw className="w-6 h-6" />
    </button>
  );
}
