
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Save, Clock, User, MessageSquare, CheckCircle, Phone, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotesPanel = ({ isOpen, onClose, lead, onSaveNote }) => {
  const [noteText, setNoteText] = useState('');

  const handleSave = () => {
    if (!noteText.trim()) return;
    onSaveNote(noteText);
    setNoteText('');
  };

  const getActivityIcon = (action) => {
    if (action.includes('Status changed')) return <CheckCircle size={14} className="text-orange-500" />;
    if (action.includes('Assigned')) return <User size={14} className="text-blue-500" />;
    if (action.includes('WhatsApp')) return <MessageSquare size={14} className="text-green-500" />;
    if (action.includes('Call')) return <Phone size={14} className="text-purple-500" />;
    if (action.includes('Note')) return <Save size={14} className="text-gray-500" />;
    return <Clock size={14} className="text-gray-400" />;
  };

  if (!lead) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 0.3 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          
          {/* Panel */}
          <motion.div 
            initial={{ x: '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l"
          >
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-lg text-[#0F3A5F]">Activity & Notes</h3>
                <p className="text-xs text-gray-500">For {lead.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Feedback Box */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Add New Note / Feedback</label>
                <div className="relative">
                  <Textarea 
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter buyer feedback, meeting notes, or key details..."
                    className="min-h-[120px] pr-2 pb-6 resize-none"
                    maxLength={500}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                    {noteText.length}/500
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full bg-[#0F3A5F] hover:bg-[#0a2742]">
                  <Save className="mr-2 h-4 w-4" /> Save Note
                </Button>
              </div>

              {/* Activity History */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center">
                  <Clock className="mr-2 h-4 w-4" /> Activity History
                </h4>
                <div className="space-y-4">
                  {[...(lead.activityLog || [])].reverse().map((log, i) => (
                    <div key={i} className="flex gap-3 relative pb-4 last:pb-0">
                      {/* Timeline Line */}
                      {i !== (lead.activityLog?.length || 0) - 1 && (
                        <div className="absolute left-[7px] top-6 bottom-0 w-[1px] bg-gray-200" />
                      )}
                      
                      <div className="mt-1 relative z-10 bg-white">
                        {getActivityIcon(log.action)}
                      </div>
                      <div className="flex-1 bg-gray-50 p-3 rounded-md border border-gray-100 text-sm">
                        <div className="font-medium text-gray-800">{log.action}</div>
                        <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
                          <span>{log.author}</span>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!lead.activityLog || lead.activityLog.length === 0) && (
                    <div className="text-center text-gray-400 py-4 text-sm">No activity recorded yet.</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotesPanel;
