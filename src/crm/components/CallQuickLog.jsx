import React, { useState } from 'react';
import { X, Phone, ChevronDown, ChevronUp, CheckCircle, PhoneOff, PhoneMissed, PhoneForwarded, BatteryWarning, XCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { CALL_OUTCOMES, QUICK_LOG_OUTCOMES, getSmartFollowUpSuggestion } from '@/crm/utils/callOutcomeUtils';

const OUTCOME_ICONS = {
  connected: CheckCircle,
  not_answered: PhoneMissed,
  busy: PhoneOff,
  callback_requested: PhoneForwarded,
  switched_off: BatteryWarning,
  wrong_number: XCircle,
};

const CallQuickLog = ({ lead, isOpen, onClose, onSuccess }) => {
  const { addCallLog, updateLead } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState('');

  const handleOutcomeTap = async (outcome) => {
    if (loading) return;
    setLoading(true);

    try {
      const callLog = {
        employeeId: user?.uid || user?.id,
        leadId: lead.id,
        leadName: lead.name,
        projectName: lead.project || 'Not specified',
        type: 'outbound',
        status: outcome.value,
        duration: 0,
        notes: note || `Quick log: ${outcome.label}`,
      };

      await addCallLog(callLog);

      const fullOutcome = CALL_OUTCOMES.find(o => o.value === outcome.value);
      if (fullOutcome?.needsFollowUp || outcome.needsFollowUp) {
        const suggestion = getSmartFollowUpSuggestion(outcome.value);
        if (suggestion.date) {
          await updateLead(lead.id, {
            status: 'FollowUp',
            followUpDate: suggestion.date,
            follow_up_date: suggestion.date,
            followUpTime: suggestion.time,
            follow_up_time: suggestion.time,
            lastActivity: new Date().toISOString(),
          });
        }
      } else {
        await updateLead(lead.id, {
          lastActivity: new Date().toISOString(),
        });
      }

      const suggestion = getSmartFollowUpSuggestion(outcome.value);
      toast({
        title: `Call logged: ${outcome.label}`,
        description: suggestion.suggestion,
      });

      setNote('');
      setShowNotes(false);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Quick log failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to log call. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl w-full max-w-lg shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Phone size={18} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Log Call Outcome</h3>
              <p className="text-sm text-gray-500">{lead.name} - {lead.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Outcome Buttons Grid */}
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-3 font-medium">Tap an outcome to log instantly:</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_LOG_OUTCOMES.map((outcome) => {
              const Icon = OUTCOME_ICONS[outcome.value];
              return (
                <button
                  key={outcome.value}
                  onClick={() => handleOutcomeTap(outcome)}
                  disabled={loading}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 ${outcome.borderColor} ${outcome.bgColor} ${outcome.hoverBg} ${outcome.textColor} transition-all active:scale-95 disabled:opacity-50 min-h-[72px]`}
                >
                  <Icon size={22} />
                  <span className="text-xs font-semibold leading-tight text-center">{outcome.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Note */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors w-full"
          >
            <FileText size={14} />
            <span>Add a note</span>
            {showNotes ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showNotes && (
            <Textarea
              placeholder="Quick note about the call..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-2 text-sm"
              autoFocus
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-2 border-t border-gray-100">
          <p className="text-center text-xs text-gray-400">
            {loading ? 'Logging call...' : 'Follow-up reminders are set automatically'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CallQuickLog;
