import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit2, Trash2, MessageSquare, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import SmartQuickNotePanel from './SmartQuickNotePanel';

/**
 * NotesModal
 * ──────────
 * Shows all notes for a lead and provides a Smart Quick Note panel for
 * adding new ones — outcome presets, intent detection, auto follow-up,
 * guardrails, decision-maker / budget / urgency intel.
 *
 * Backwards-compatible API:
 * - `onAddNote(text)` is still called with a flat string for callers that
 *   only handle strings (the snapshot's `useCRMData` does this today).
 * - When the smart panel returns structured data, we ALSO call
 *   `onAddStructuredNote?.(value)` if the parent provides it. Production
 *   should wire that to persist `tags`, `pickup_status`, `next_follow_up_at`,
 *   `lost_reason` columns on `crm_leads` + a row in `crm_lead_interactions`.
 */
const NotesModal = ({
  isOpen,
  onClose,
  lead,
  onAddNote,
  onAddStructuredNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editText, setEditText] = useState('');

  const startEditing = (note) => {
    setEditingNoteId(note.id);
    setEditText(note.text);
  };

  const saveEdit = (noteId) => {
    if (!editText.trim()) return;
    onUpdateNote(noteId, editText);
    setEditingNoteId(null);
    setEditText('');
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditText('');
  };

  const handleDelete = (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      onDeleteNote(noteId);
    }
  };

  // Compose the rich note text from structured fields and persist via the
  // simple string API. If the parent also accepts structured data, send it.
  const handleSave = (value) => {
    const parts = [value.note];
    if (value.tags?.length) parts.push(`Tags: ${value.tags.join(', ')}`);
    if (value.nextFollowUpAt) {
      const d = new Date(value.nextFollowUpAt);
      parts.push(`Follow-up: ${d.toLocaleString()}`);
    }
    if (value.lostReason) parts.push(`Lost reason: ${value.lostReason}`);
    if (value.budgetLakhs != null) parts.push(`Budget: ₹${value.budgetLakhs}L`);
    const composed = parts.join(' · ');

    onAddNote(composed);
    onAddStructuredNote?.(value);

    // Auto-feedback: confirm what was scheduled.
    if (value.nextFollowUpAt) {
      const d = new Date(value.nextFollowUpAt);
      const dateStr = d.toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
      toast({
        title: '📞 Follow-up scheduled',
        description: `${lead?.name || 'Lead'} — ${dateStr}`,
      });
    } else if (value.tags?.includes('not_interested')) {
      toast({
        title: '❌ Marked Not Interested',
        description: value.lostReason ? `Reason: ${value.lostReason}` : '',
      });
    } else {
      toast({ title: 'Note saved' });
    }
  };

  const sortedNotes = lead?.notes ? [...lead.notes].reverse() : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#0F3A5F]">
            <MessageSquare className="h-5 w-5" />
            Notes for {lead?.name}
            {sortedNotes.length > 0 && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {sortedNotes.length}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Smart Quick Note entry — replaces the old textarea+Add button */}
          <SmartQuickNotePanel onSave={handleSave} />

          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="space-y-4 pb-4">
              {sortedNotes.length === 0 ? (
                <div className="text-center text-gray-400 py-8 italic">No notes added yet.</div>
              ) : (
                sortedNotes.map(note => (
                  <div key={note.id || Math.random()} className="bg-white border rounded-lg p-3 shadow-sm relative group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#0F3A5F]">{note.author}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(note.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingNoteId !== note.id && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditing(note)} aria-label="Edit note">
                              <Edit2 size={12} className="text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(note.id)} aria-label="Delete note">
                              <Trash2 size={12} className="text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[60px] text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-8 text-xs">Cancel</Button>
                          <Button size="sm" onClick={() => saveEdit(note.id)} className="h-8 text-xs bg-green-600 hover:bg-green-700">Save</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.text}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotesModal;
