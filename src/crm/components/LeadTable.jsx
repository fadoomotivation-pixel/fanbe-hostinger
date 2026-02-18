import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageSquare, Edit2, Calendar, ArrowUpDown, StickyNote, Trash2, UserPlus, RefreshCw, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateScore, getScoreBadge, getScoreColor, getProgressBarColor } from '@/lib/leadScoringEngine';

// Normalize notes: handles both Supabase string and legacy array format
const getLastNoteText = (notes) => {
  if (!notes) return null;
  // Legacy format: array of {text, timestamp, author}
  if (Array.isArray(notes)) {
    if (notes.length === 0) return null;
    const last = notes[notes.length - 1];
    return last?.text || null;
  }
  // Supabase format: plain string
  if (typeof notes === 'string' && notes.trim() !== '') {
    return notes.trim();
  }
  return null;
};

const LeadTable = ({ 
  leads, 
  onAction, 
  onStatusChange, 
  selectedIds = [], 
  onSelectLead, 
  onSelectAll,
  type = 'daily' 
}) => {
  const [sortField, setSortField] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedLeads = [...leads].map(lead => ({...lead, score: calculateScore(lead)})).sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FollowUp': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Booked': return 'bg-green-100 text-green-800 border-green-200';
      case 'Lost': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700 h-6">
                      {selectedIds.length} Selected
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-gray-500 hover:text-gray-900" onClick={() => onSelectAll(false)}>
                      <X size={12} className="mr-1" /> Clear
                  </Button>
              </div>
              <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => onAction('bulk_assign')}>
                      <UserPlus size={14} className="mr-2" /> Assign
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => onAction('bulk_status')}>
                      <RefreshCw size={14} className="mr-2" /> Status
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onAction('bulk_delete')}>
                      <Trash2 size={14} className="mr-2" /> Delete
                  </Button>
              </div>
          </div>
      )}

      {/* Desktop & Tablet Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="p-4 w-10">
                  <Checkbox 
                    checked={leads.length > 0 && selectedIds.length === leads.length}
                    onCheckedChange={onSelectAll}
                  />
                </th>
                <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('score')}>
                  <div className="flex items-center">Score <ArrowUpDown size={12} className="ml-1 text-gray-400" /></div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Name <ArrowUpDown size={12} className="ml-1 text-gray-400" /></div>
                </th>
                <th className="p-4">Contact</th>
                <th className="p-4">Project</th>
                {type === 'daily' && <th className="p-4 hidden lg:table-cell">Assigned To</th>}
                {type === 'follow-up' && <th className="p-4">Follow-Up</th>}
                {type === 'booked' && <th className="p-4">Booking</th>}
                {type === 'lost' && <th className="p-4">Reason</th>}
                <th className="p-4 w-64">Notes</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedLeads.length === 0 ? (
                <tr><td colSpan="10" className="p-8 text-center text-gray-400">No leads found.</td></tr>
              ) : (
                sortedLeads.map(lead => {
                  // Safe notes extraction — works with both string and array
                  const noteText = getLastNoteText(lead.notes);
                  const score = lead.score;
                  const scoreBadge = getScoreBadge(score);
                  const scoreColor = getScoreColor(score);
                  const progressColor = getProgressBarColor(score);

                  return (
                    <tr key={lead.id} className={`hover:bg-blue-50/30 transition-colors group ${selectedIds.includes(lead.id) ? 'bg-blue-50' : ''}`}>
                      <td className="p-4">
                        <Checkbox 
                          checked={selectedIds.includes(lead.id)} 
                          onCheckedChange={(c) => onSelectLead(lead.id, c)} 
                        />
                      </td>
                      <td className="p-4 w-24">
                          <div className="flex flex-col gap-1 items-center">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${scoreColor}`}>{scoreBadge}</span>
                              <span className="text-xl font-bold text-gray-700">{score}</span>
                              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full ${progressColor}`} style={{ width: `${score}%` }}></div>
                              </div>
                          </div>
                      </td>
                      <td className="p-4 font-medium text-[#0F3A5F]">
                          <div>{lead.name}</div>
                          {lead.isVIP && <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200 ml-1 text-[10px]">VIP</Badge>}
                      </td>
                      <td className="p-4">
                        <div className="text-gray-600">{lead.phone}</div>
                        <div className="text-xs text-gray-400">{lead.email}</div>
                      </td>
                      <td className="p-4 text-gray-600">{lead.project}</td>

                      {type === 'daily' && <td className="p-4 text-xs text-gray-500 hidden lg:table-cell">
                         <div className="font-medium">{lead.assignedToName || 'Unassigned'}</div>
                      </td>}
                      {type === 'follow-up' && <td className="p-4">—</td>}
                      {type === 'booked' && <td className="p-4">—</td>}
                      {type === 'lost' && <td className="p-4">—</td>}

                      <td className="p-4">
                        <div className="flex items-start gap-2 group/note cursor-pointer" onClick={() => onAction('viewNotes', lead)}>
                          <div className="flex-1 min-w-0">
                            {noteText ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-xs text-gray-600 truncate max-w-[180px]">
                                      {noteText.length > 50 ? noteText.substring(0, 50) + '...' : noteText}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent><p className="max-w-xs">{noteText}</p></TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No notes</span>
                            )}
                          </div>
                          <Edit2 size={12} className="text-gray-400 opacity-0 group-hover/note:opacity-100 transition-opacity mt-1" />
                        </div>
                      </td>

                      <td className="p-4">
                        <Select value={lead.status} onValueChange={(val) => onStatusChange(lead, val)}>
                          <SelectTrigger className={`h-8 w-28 text-xs border border-transparent focus:ring-0 ${getStatusColor(lead.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Open">Open</SelectItem>
                            <SelectItem value="FollowUp">Follow Up</SelectItem>
                            <SelectItem value="Booked">Booked</SelectItem>
                            <SelectItem value="Lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full" onClick={(e) => { e.stopPropagation(); onAction('call', lead); }}>
                            <Phone size={14} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100 rounded-full" onClick={(e) => { e.stopPropagation(); onAction('whatsapp', lead); }}>
                            <MessageSquare size={14} />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full" onClick={(e) => { e.stopPropagation(); onAction('viewNotes', lead); }}>
                            <StickyNote size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {selectedIds.length > 0 && (
             <div className="sticky top-0 z-10 bg-white p-2 shadow-md rounded-md flex justify-between items-center mb-2">
                 <span className="text-sm font-bold text-blue-800">{selectedIds.length} Selected</span>
                 <Button variant="ghost" size="sm" className="h-8" onClick={() => onAction('bulk_delete')}><Trash2 size={16} className="text-red-500" /></Button>
             </div>
        )}
        {sortedLeads.map(lead => {
          const noteText = getLastNoteText(lead.notes);
          return (
            <div key={lead.id} className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3 ${selectedIds.includes(lead.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                 <div className="flex gap-3">
                     <Checkbox checked={selectedIds.includes(lead.id)} onCheckedChange={(c) => onSelectLead(lead.id, c)} className="mt-1" />
                     <div className="flex-1">
                         <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-900">{lead.name}</h3>
                                <div className="text-sm text-blue-600">{lead.phone}</div>
                            </div>
                            <Badge variant="outline">{lead.status}</Badge>
                         </div>
                         <div className="mt-2 text-xs text-gray-500">{lead.project}</div>
                         {noteText && (
                           <div className="mt-1 text-xs text-gray-400 italic truncate">
                             {noteText.length > 60 ? noteText.substring(0, 60) + '...' : noteText}
                           </div>
                         )}
                     </div>
                 </div>
                 <div className="flex gap-2 pt-2 border-t mt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('call', lead)}><Phone size={14} className="mr-1" /> Call</Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('whatsapp', lead)}><MessageSquare size={14} className="mr-1" /> WA</Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('viewNotes', lead)}><StickyNote size={14} className="mr-1" /> Notes</Button>
                 </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeadTable;
