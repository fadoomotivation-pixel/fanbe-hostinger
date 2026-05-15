import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Phone, MessageCircle, Loader2 } from 'lucide-react';
import { useLeads } from '@/crm/hooks/useLeads';
import NotificationPermissionBanner from '@/crm/components/NotificationPermissionBanner';
import { useFollowUpNotifications } from '@/crm/hooks/useFollowUpNotifications';
import { useNewLeadNotifications } from '@/crm/hooks/useNewLeadNotifications';

const STATUS_COLOR = {
  Booked:   'bg-green-100 text-green-800',
  FollowUp: 'bg-yellow-100 text-yellow-800',
  Lost:     'bg-gray-100 text-gray-800',
  Open:     'bg-blue-100 text-blue-800',
};

// Combine the live schema's separate date + time columns into an ISO timestamp
// so the generic follow-up notification hook can schedule a setTimeout.
function combineFollowUp(lead) {
  if (!lead.follow_up_date) return null;
  const time = lead.follow_up_time || '10:00:00';
  return new Date(`${lead.follow_up_date}T${time}`).toISOString();
}

export default function MyLeads() {
  const { user } = useAuth();
  const {
    leads,
    total,
    loading,
    loadingMore,
    hasMore,
    error,
    search,
    setSearch,
    status,
    setStatus,
    scope,
    loadMore,
    refetch,
  } = useLeads({ scope: 'mine' });

  // Map the live `leads` row shape onto what the follow-up hook expects
  const leadsForReminders = useMemo(
    () => leads.map(l => ({
      id: l.id,
      name: l.name,
      phone: l.phone,
      nextFollowUpAt: combineFollowUp(l),
      status: l.status,
      quickNote: l.last_note,
    })),
    [leads],
  );

  useFollowUpNotifications(leadsForReminders);
  useNewLeadNotifications(() => refetch());

  return (
    <div className="space-y-4 pb-20">
      <NotificationPermissionBanner />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#0F3A5F]">My Leads</h1>
          <p className="text-sm text-gray-500">
            {total !== null
              ? <>Showing {leads.length} of <span className="font-medium">{total}</span> {scope === 'all' ? 'leads (all)' : 'leads assigned to you'}</>
              : 'Loading…'}
          </p>
        </div>
        <Button className="w-full md:w-auto min-h-[44px] bg-[#0F3A5F]">
          <Plus className="mr-2 h-4 w-4" /> Add New Lead
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or phone…"
                className="pl-10 min-h-[44px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="md:w-[180px] min-h-[44px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="FollowUp">Follow Up</SelectItem>
                <SelectItem value="Booked">Booked</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              Failed to load leads: {error.message}
            </div>
          )}

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2" /> Loading leads…
                  </TableCell></TableRow>
                ) : leads.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-12 text-gray-400">
                    No leads found{search ? ` for "${search}"` : ''}.
                  </TableCell></TableRow>
                ) : (
                  leads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-gray-500">{lead.phone}</div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{lead.project_name || '—'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[lead.status] || 'bg-gray-100 text-gray-700'}`}>
                          {lead.status || '—'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-gray-500">
                        {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-10 w-10"
                            onClick={() => { if (lead.phone) window.location.href = `tel:${lead.phone}`; }}
                            aria-label="Call"
                          >
                            <Phone className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-10 w-10"
                            onClick={() => {
                              if (!lead.phone) return;
                              const tail = String(lead.phone).replace(/\D/g, '').slice(-10);
                              window.open(`https://wa.me/91${tail}`, '_blank', 'noopener');
                            }}
                            aria-label="WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {hasMore && !loading && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="min-h-[44px] w-full md:w-auto"
              >
                {loadingMore ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…</>
                ) : (
                  <>Load 50 more</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
