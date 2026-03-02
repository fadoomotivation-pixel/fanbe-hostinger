import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, X } from 'lucide-react';

/**
 * Searchable lead picker — much faster than a 1000-item dropdown.
 * Type a name, phone, or project → pick from filtered list.
 */
const LeadSearchPicker = ({ leads, value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedLead = leads.find(l => l.id === value);

  const filtered = query.trim().length > 0
    ? leads.filter(l =>
        l.name?.toLowerCase().includes(query.toLowerCase()) ||
        l.phone?.includes(query) ||
        l.project?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : leads.slice(0, 8);

  const handleSelect = (lead) => {
    onChange(lead.id);
    setQuery('');
    setOpen(false);
  };

  /* Show selected lead as a chip */
  if (selectedLead) {
    return (
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
        <div>
          <p className="font-semibold text-blue-900 text-sm">{selectedLead.name}</p>
          <p className="text-xs text-blue-600">{selectedLead.project} · {selectedLead.phone}</p>
        </div>
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-blue-400 hover:text-blue-700 ml-2 p-0.5"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-8 text-sm"
          placeholder="Type name, phone, or project…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border shadow-lg max-h-56 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map(lead => (
              <button
                key={lead.id}
                type="button"
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center justify-between"
                onMouseDown={() => handleSelect(lead)}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                  <p className="text-xs text-gray-500">{lead.project} · {lead.phone}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                  lead.status === 'Booked'   ? 'bg-green-100 text-green-700'  :
                  lead.status === 'FollowUp' ? 'bg-amber-100 text-amber-700'  :
                  lead.status === 'Lost'     ? 'bg-red-100 text-red-700'      :
                                               'bg-gray-100 text-gray-600'
                }`}>{lead.status}</span>
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-xs text-gray-400 text-center">No matching leads found.</div>
          )}
        </div>
      )}
    </div>
  );
};

const SiteVisits = () => {
  const { user } = useAuth();
  const { leads, addSiteVisitLog, siteVisits } = useCRMData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    leadId:   '',
    date:     '',
    interest: 'Medium',
    feedback: '',
  });

  const myLeads  = leads.filter(l => l.assignedTo === user?.id);
  const myVisits = siteVisits
    .filter(v => v.employeeId === user?.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.leadId) return toast({ title: 'Error', description: 'Select a lead first', variant: 'destructive' });

    const lead = myLeads.find(l => l.id === formData.leadId);
    addSiteVisitLog({
      ...formData,
      employeeId:  user.id,
      leadName:    lead?.name    || 'Unknown',
      projectName: lead?.project || 'General',
    });

    toast({ title: 'Success', description: 'Site visit logged' });
    setFormData({ leadId: '', date: '', interest: 'Medium', feedback: '' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">Site Visit Tracker</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Log form */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader><CardTitle>Log Visit</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Lead</label>
                <LeadSearchPicker
                  leads={myLeads}
                  value={formData.leadId}
                  onChange={val => setFormData({ ...formData, leadId: val })}
                />
                <p className="text-[11px] text-gray-400">Search by name, phone, or project</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Visit Date & Time</label>
                <Input
                  type="datetime-local"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Interest Level</label>
                <Select
                  value={formData.interest}
                  onValueChange={val => setFormData({ ...formData, interest: val })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Feedback</label>
                <Textarea
                  value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="Client feedback after the visit…"
                />
              </div>

              <Button type="submit" className="w-full">Save Visit Log</Button>
            </form>
          </CardContent>
        </Card>

        {/* History table */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Visit History</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Feedback</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myVisits.map(visit => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-medium">{visit.leadName}</TableCell>
                    <TableCell>{new Date(visit.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        visit.interest === 'High'   ? 'bg-green-100 text-green-800' :
                        visit.interest === 'Low'    ? 'bg-red-100 text-red-700'    :
                                                      'bg-yellow-100 text-yellow-700'
                      }`}>
                        {visit.interest}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-gray-600">{visit.feedback}</TableCell>
                  </TableRow>
                ))}
                {myVisits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-400 py-8">No visits logged yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SiteVisits;
