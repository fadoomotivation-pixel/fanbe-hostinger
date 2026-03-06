// src/crm/pages/SiteVisits.jsx
// ✅ Fixed: async handleSubmit (awaits addSiteVisitLog)
// ✅ Fixed: correct field names (visitDate not date)
// ✅ Fixed: interest level saved inside notes column
// ✅ Fixed: history reads from correct normalized fields
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, X, Loader2, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// ── Searchable lead picker ───────────────────────────────────────────
const LeadSearchPicker = ({ leads, value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen]   = useState(false);
  const selectedLead = leads.find(l => l.id === value);

  const filtered = query.trim().length > 0
    ? leads.filter(l =>
        l.name?.toLowerCase().includes(query.toLowerCase()) ||
        l.phone?.includes(query) ||
        l.project?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : leads.slice(0, 8);

  if (selectedLead) {
    return (
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
        <div>
          <p className="font-semibold text-blue-900 text-sm">{selectedLead.name}</p>
          <p className="text-xs text-blue-600">{selectedLead.project} · {selectedLead.phone}</p>
        </div>
        <button type="button" onClick={() => onChange('')} className="text-blue-400 hover:text-blue-700 ml-2">
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input className="pl-8 text-sm" placeholder="Type name, phone, or project…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border shadow-lg max-h-56 overflow-y-auto">
          {filtered.length > 0 ? filtered.map(lead => (
            <button key={lead.id} type="button"
              className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center justify-between"
              onMouseDown={() => { onChange(lead.id); setQuery(''); setOpen(false); }}>
              <div>
                <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                <p className="text-xs text-gray-500">{lead.project} · {lead.phone}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                lead.status === 'Booked'   ? 'bg-green-100 text-green-700' :
                lead.status === 'FollowUp' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
              }`}>{lead.status}</span>
            </button>
          )) : (
            <div className="px-3 py-4 text-xs text-gray-400 text-center">No matching leads found.</div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Interest badge ───────────────────────────────────────────────
const extractInterest = (notes) => {
  if (!notes) return null;
  const m = notes.match(/^\[Interest: (\w+)\]/);
  return m ? m[1] : null;
};
const extractFeedback = (notes) => {
  if (!notes) return '';
  return notes.replace(/^\[Interest: \w+\] /, '');
};

const SiteVisits = () => {
  const { user } = useAuth();
  const { leads, addSiteVisitLog, siteVisits, siteVisitsLoading } = useCRMData();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    leadId:   '',
    date:     '',       // datetime-local input value
    interest: 'Medium',
    feedback: '',
  });

  // Pre-select lead from URL params
  useEffect(() => {
    const leadIdFromUrl = searchParams.get('leadId');
    if (leadIdFromUrl && leads.length > 0) {
      const lead = leads.find(l => l.id === leadIdFromUrl);
      if (lead && (lead.assignedTo === user?.id || lead.assigned_to === user?.id ||
                   lead.assignedTo === user?.uid || lead.assigned_to === user?.uid)) {
        setFormData(prev => ({ ...prev, leadId: leadIdFromUrl }));
        toast({ title: '✅ Lead Pre-selected', description: `${lead.name} is ready`, duration: 3000 });
      }
    }
  }, [searchParams, leads, user]);

  const userId  = user?.uid || user?.id;
  const myLeads = leads.filter(l => l.assignedTo === userId || l.assigned_to === userId);

  // ✅ FIXED: filter by normalized employeeId field (from useCRMData normalization)
  const myVisits = siteVisits
    .filter(v => v.employeeId === userId)
    .sort((a, b) => new Date(b.timestamp || b.visitDate) - new Date(a.timestamp || a.visitDate));

  // ✅ FIXED: handleSubmit is now async and awaits addSiteVisitLog
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leadId) {
      toast({ title: 'Error', description: 'Select a lead first', variant: 'destructive' }); return;
    }
    if (!formData.date) {
      toast({ title: 'Error', description: 'Select visit date & time', variant: 'destructive' }); return;
    }
    if (!formData.feedback.trim()) {
      toast({ title: 'Error', description: 'Add client feedback', variant: 'destructive' }); return;
    }

    setSubmitting(true);
    try {
      const lead = myLeads.find(l => l.id === formData.leadId);
      const visitDateObj = new Date(formData.date);

      // ✅ FIXED: correct field names that addSiteVisit() reads
      const result = await addSiteVisitLog({
        leadId:      formData.leadId,
        employeeId:  userId,
        leadName:    lead?.name    || 'Unknown',
        projectName: lead?.project || 'General',
        visitDate:   visitDateObj.toISOString().split('T')[0],      // ✅ was: date (wrong)
        visitTime:   visitDateObj.toTimeString().slice(0, 5),        // ✅ was: missing
        status:      'Completed',
        // ✅ Store interest level inside notes as prefix so it can be parsed back
        notes:       `[Interest: ${formData.interest}] ${formData.feedback.trim()}`,
        feedback:    formData.feedback.trim(),
        location:    lead?.project || '',
        duration:    null,
      });

      if (result) {
        // Also update lead status to SiteVisit
        toast({
          title: '✅ Site Visit Logged!',
          description: `${lead?.name} — ${formData.interest} interest • synced to cloud`,
        });
        setFormData({ leadId: '', date: '', interest: 'Medium', feedback: '' });
      } else {
        toast({ title: '❌ Save failed', description: 'Check Supabase logs. Data may not have saved.', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Site Visit Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">All visits sync to cloud • visible to admin & subadmin in real-time</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700">Live Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Log Form ── */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={18} className="text-[#0F3A5F]" /> Log Site Visit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Lead *</label>
                <LeadSearchPicker leads={myLeads} value={formData.leadId}
                  onChange={val => setFormData({ ...formData, leadId: val })} />
                <p className="text-[11px] text-gray-400">Search by name, phone, or project</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar size={13} /> Visit Date & Time *
                </label>
                <Input type="datetime-local"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <TrendingUp size={13} /> Interest Level
                </label>
                <Select value={formData.interest}
                  onValueChange={val => setFormData({ ...formData, interest: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">🔥 High — Very Interested</SelectItem>
                    <SelectItem value="Medium">👍 Medium — Considering</SelectItem>
                    <SelectItem value="Low">🥶 Low — Just Looking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Client Feedback *</label>
                <Textarea value={formData.feedback}
                  onChange={e => setFormData({ ...formData, feedback: e.target.value })}
                  placeholder="What did the client say after visiting the site?"
                  required rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving to Cloud...</> : 'Save Visit Log'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── History Table ── */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Visit History ({myVisits.length})</span>
              {siteVisitsLoading && <Loader2 size={16} className="animate-spin text-gray-400" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myVisits.length === 0 && !siteVisitsLoading ? (
              <div className="text-center py-16">
                <MapPin size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">No visits logged yet.</p>
                <p className="text-xs text-gray-300 mt-1">Log your first site visit on the left.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Visit Date</TableHead>
                    <TableHead>Interest</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myVisits.map((visit, idx) => {
                    // ✅ FIXED: parse interest from notes prefix
                    const interest  = extractInterest(visit.notes) || visit.interest || '—';
                    const feedback  = extractFeedback(visit.notes) || visit.feedback || '—';
                    const visitDate = visit.visitDate || visit.timestamp;

                    return (
                      <TableRow key={visit.id || idx}>
                        <TableCell className="font-medium">
                          {visit.leadName || '—'}
                          {visit.projectName && (
                            <p className="text-xs text-gray-400 mt-0.5">{visit.projectName}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {visitDate
                            ? (() => { try { return format(parseISO(visitDate), 'dd MMM yyyy, hh:mm a'); } catch { return visitDate; } })()
                            : '—'
                          }
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            interest === 'High'   ? 'bg-green-100 text-green-800' :
                            interest === 'Low'    ? 'bg-red-100 text-red-700'    :
                            interest === '—'     ? 'bg-gray-100 text-gray-500'   :
                                                    'bg-yellow-100 text-yellow-700'
                          }`}>{interest}</span>
                        </TableCell>
                        <TableCell className="max-w-[200px] text-gray-600 text-sm">
                          <p className="line-clamp-2">{feedback}</p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SiteVisits;
