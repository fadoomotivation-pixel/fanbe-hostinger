// src/components/crm/MobileUpdateStatus.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface MobileUpdateStatusProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  leadId: string;
  onUpdate: (status: string, followUpDate?: string, followUpTime?: string, remarks?: string) => Promise<void>;
}

const statusOptions = [
  { value: 'New Lead', color: 'bg-blue-500', textColor: 'text-white' },
  { value: 'Follow Up', color: 'bg-yellow-500', textColor: 'text-white' },
  { value: 'Site Visit Scheduled', color: 'bg-purple-500', textColor: 'text-white' },
  { value: 'Site Visit Done', color: 'bg-indigo-500', textColor: 'text-white' },
  { value: 'Negotiation', color: 'bg-orange-500', textColor: 'text-white' },
  { value: 'Token/Booking', color: 'bg-green-600', textColor: 'text-white' },
  { value: 'Not Interested', color: 'bg-red-500', textColor: 'text-white' },
  { value: 'Deal Closed', color: 'bg-green-800', textColor: 'text-white' }
];

const statusesNeedingFollowUp = ['Follow Up', 'Site Visit Scheduled', 'Negotiation'];

export default function MobileUpdateStatus({ 
  isOpen, 
  onClose, 
  currentStatus, 
  leadId,
  onUpdate 
}: MobileUpdateStatusProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const needsFollowUp = statusesNeedingFollowUp.includes(selectedStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (needsFollowUp && (!followUpDate || !followUpTime)) {
      alert('Please select follow-up date and time');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(
        selectedStatus,
        needsFollowUp ? followUpDate : undefined,
        needsFollowUp ? followUpTime : undefined,
        remarks || undefined
      );
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-3xl flex justify-between items-center">
          <h2 className="text-xl font-bold">Update Status</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            type="button"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 pb-8">
          {/* Status Grid */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedStatus(option.value)}
                  className={`
                    ${option.color} ${option.textColor}
                    p-4 rounded-xl font-medium text-sm
                    transition-all duration-200
                    ${selectedStatus === option.value 
                      ? 'ring-4 ring-blue-300 scale-105 shadow-lg' 
                      : 'opacity-80 hover:opacity-100 hover:scale-102'
                    }
                  `}
                >
                  {option.value}
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Fields */}
          {needsFollowUp && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                Follow-up Required
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remarks
              <span className="text-gray-400 text-xs ml-2">
                ({remarks.length}/500)
              </span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setRemarks(e.target.value);
                }
              }}
              rows={4}
              placeholder="Add any notes about this update..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none text-base"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </span>
            ) : (
              'Update Status'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
