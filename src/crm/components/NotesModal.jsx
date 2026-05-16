import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Send } from 'lucide-react';

const NotesModal = ({ isOpen, onClose, lead }) => {
  const { addLeadNote } = useCRMData();
  const { user } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const notes = lead?.notes
    ? lead.notes.split('\n').filter(Boolean).reverse()
    : [];

  const handleSave = async () => {
    if (!newNote.trim()) return;
    setIsSaving(true);
    await addLeadNote(lead.id, newNote.trim(), user.name);
    setNewNote('');
    setIsSaving(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg flex flex-col" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-600" />
            Notes — {lead?.name}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable notes history */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[280px] rounded-md border bg-gray-50 p-3">
            {notes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No notes yet. Add the first one below.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border text-sm shadow-sm">
                    <p className="text-gray-800 whitespace-pre-wrap">{note}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Add new note */}
        <div className="shrink-0 space-y-3 pt-2">
          <Textarea
            placeholder="Add a note..."
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            className="resize-none"
            rows={3}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
            }}
          />
          <p className="text-xs text-gray-400">Tip: Ctrl+Enter to save</p>
        </div>

        <DialogFooter className="shrink-0 border-t pt-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} disabled={isSaving || !newNote.trim()} className="gap-2">
            <Send size={14} /> {isSaving ? 'Saving...' : 'Add Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotesModal;
