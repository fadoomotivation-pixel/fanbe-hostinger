
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit2, Trash2, Save, X, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const NotesModal = ({ isOpen, onClose, lead, onAddNote, onUpdateNote, onDeleteNote }) => {
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editText, setEditText] = useState('');
  const { user } = useAuth();

  const handleAdd = () => {
    if (!newNote.trim()) return;
    onAddNote(newNote);
    setNewNote('');
  };

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

  const sortedNotes = lead?.notes ? [...lead.notes].reverse() : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
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
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
            <Textarea 
              placeholder="Type a new note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px] bg-white resize-none"
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={handleAdd} disabled={!newNote.trim()} className="bg-[#0F3A5F]">
                Add Note
              </Button>
            </div>
          </div>

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
                      
                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingNoteId !== note.id && (
                          <>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditing(note)}>
                              <Edit2 size={12} className="text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(note.id)}>
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
                          <Button variant="ghost" size="sm" onClick={cancelEdit} className="h-7 text-xs">Cancel</Button>
                          <Button size="sm" onClick={() => saveEdit(note.id)} className="h-7 text-xs bg-green-600 hover:bg-green-700">Save</Button>
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
