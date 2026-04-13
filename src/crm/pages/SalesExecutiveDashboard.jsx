import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  Phone, Users, Calendar, TrendingUp, CheckSquare, PlusCircle,
  Clock, ArrowUpRight, DollarSign, Activity, UserCheck,
  Search, X, ChevronRight, Flame
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';
import FollowUpReminders from '@/crm/components/FollowUpReminders';
import { supabase } from '@/lib/supabase';

/* ── Status badge helper ── */
const STATUS_CFG = {
  Open:        { bg: 'rgba(59,130,246,0.12)',  text: '#1d4ed8', label: 'Open'      },
  FollowUp:    { bg: 'rgba(245,158,11,0.12)',  text: '#b45309', label: 'Follow Up' },
  'Follow Up': { bg: 'rgba(245,158,11,0.12)',  text: '#b45309', label: 'Follow Up' },
  Booked:      { bg: 'rgba(16,185,129,0.12)',  text: '#065f46', label: 'Booked'    },
  Lost:        { bg: 'rgba(239,68,68,0.12)',   text: '#991b1b', label: 'Lost'      },
};
const getStatus = s => STATUS_CFG[s] || STATUS_CFG.Open;

/* ── Lead Search Result Row ── */
const LeadRow = ({ lead, onClick }) => {
  const st = getStatus(lead.status);
  const initials = (lead.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      onClick={() => onClick(lead.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', cursor: 'pointer',
        borderBottom: '1px solid #f1f5f9',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: '#fff',
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.name}
        </p>
        <p style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.phone}{lead.project ? ` · ${lead.project}` : ''}
        </p>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99,
        background: st.bg, color: st.text, whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {st.label}
      </span>
      <ChevronRight size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
    </div>
  );
};

/* ── Lead Search Bar ── */
const LeadSearchBar = ({ userId }) => {
  const navigate = useNavigate();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const debRef   = useRef(null);
  const wrapRef  = useRef(null);

  const runSearch = useCallback(async (q) => {
    if (!q.trim() || !userId) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from('leads')
        .select('id,name,phone,project,status')
        .eq('assigned_to', userId)
        .or(`name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%,project.ilike.%${q.trim()}%`)
        .order('updated_at', { ascending: false })
        .limit(8);
      setResults(data || []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    setOpen(true);
    debRef.current = setTimeout(() => runSearch(query), 320);
    return () => clearTimeout(debRef.current);
  }, [query, runSearch]);

  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = id => {
    navigate(`/crm/lead/${id}`);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', maxWidth: 560 }}>
      <div style={{ position: 'relative' }}>
        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search leads by name, phone or project…"
          style={{
            width: '100%', height: 46, paddingLeft: 38, paddingRight: query ? 36 : 14,
            borderRadius: 12, border: '1.5px solid #e2e8f0',
            background: '#fff', fontSize: 15, color: '#0f172a',
            outline: 'none', boxSizing: 'border-box',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#2563eb'; if (query.trim()) setOpen(true); }}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={15} color="#94a3b8" />
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 999, overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '16px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>Searching…</div>
          ) : results.length === 0 ? (
            <div style={{ padding: '20px 16px', textAlign: 'center' }}>
              <Search size={20} color="#cbd5e1" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>No leads found for "{query}"</p>
            </div>
          ) : (
            <>
              <div style={{ padding: '8px 14px 6px', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
              </div>
              {results.map(lead => (
                <LeadRow key={lead.id} lead={lead} onClick={handleSelect} />
              ))}
              <div
                onClick={() => navigate('/crm/sales/my-leads')}
                style={{
                  padding: '10px 14px', textAlign: 'center', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: '#2563eb',
                  borderTop: '1px solid #f1f5f9', background: '#f8fafc',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
              >
                View all my leads →
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════ */

const SalesExecutiveDashboard = () => {
  const { user } = useAuth();
  const { leads, calls, siteVisits, bookings, tasks } = useCRMData();
  const navigate = useNavigate();
  const userId = user?.uid || user?.id;

  const myLeads    = leads.filter(l => l.assignedTo === user?.id);
  const myCalls    = calls.filter(c => c.employeeId === user?.id);
  const myVisits   = siteVisits.filter(v => v.employeeId === user?.id);
  const myBookings = bookings.filter(b => b.employeeId === user?.id);
  const myTasks    = tasks.filter(t => t.employeeId === user?.id);

  const today = new Date().toISOString().split('T')[0];
  const callsToday          = myCalls.filter(c => c.timestamp?.startsWith(today));
  const visitsToday         = myVisits.filter(v => v.timestamp?.startsWith(today));
  const bookingsToday       = myBookings.filter(b => b.timestamp?.startsWith(today));
  const connectedCallsToday = callsToday.filter(c => c.status === 'Connected');
  const totalRevenue        = myBookings.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);

  const pendingTasks = myTasks.filter(t => t.status === 'Pending');
  const tasksToday   = pendingTasks.filter(t => t.deadline?.startsWith(today));

  const recentActivity = [
    ...myCalls.map(c    => ({ ...c, type: 'call',    label: 'Call Logged' })),
    ...myVisits.map(v   => ({ ...v, type: 'visit',   label: 'Site Visit'  })),
    ...myBookings.map(b => ({ ...b, type: 'booking', label: 'Booking'     })),
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  return (
    <div className="space-y-6 pb-20">
      {/* Header + Search */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#0F3A5F]">Dashboard</h1>
            <p className="text-gray-500">Welcome back, {user?.name}</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium text-gray-900">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
          </div>
        </div>
        <LeadSearchBar userId={userId} />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase">Calls Today</p>
              <h3 className="text-2xl font-bold text-blue-900">{callsToday.length}</h3>
              <p className="text-xs text-blue-500">{connectedCallsToday.length} Connected</p>
            </div>
            <Phone className="text-blue-400 h-5 w-5" />
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-purple-600 uppercase">Site Visits</p>
              <h3 className="text-2xl font-bold text-purple-900">{visitsToday.length}</h3>
              <p className="text-xs text-purple-500">Total: {myVisits.length}</p>
            </div>
            <Users className="text-purple-400 h-5 w-5" />
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase">Bookings</p>
              <h3 className="text-2xl font-bold text-green-900">{myBookings.length}</h3>
              <p className="text-xs text-green-500">Val: ₹{(totalRevenue/100000).toFixed(1)}L</p>
            </div>
            <DollarSign className="text-green-400 h-5 w-5" />
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase">Pending Tasks</p>
              <h3 className="text-2xl font-bold text-orange-900">{pendingTasks.length}</h3>
              <p className="text-xs text-orange-500">{tasksToday.length} Due Today</p>
            </div>
            <CheckSquare className="text-orange-400 h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Button className="h-auto py-3 flex flex-col gap-1 col-span-2 sm:col-span-3 bg-green-600 hover:bg-green-700 text-white" onClick={() => navigate('/crm/sales/crm')}>
                <Phone className="h-5 w-5" />
                <span className="text-xs font-bold">Start Calling (CRM)</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/daily-calling')}>
                <Phone className="h-5 w-5 text-blue-600" />
                <span className="text-xs">Log Call</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/site-visits')}>
                <Users className="h-5 w-5 text-purple-600" />
                <span className="text-xs">Log Visit</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/bookings')}>
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-xs">New Booking</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/tasks')}>
                <CheckSquare className="h-5 w-5 text-orange-600" />
                <span className="text-xs">Add Task</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/my-leads')}>
                <PlusCircle className="h-5 w-5 text-gray-600" />
                <span className="text-xs">Add Lead</span>
              </Button>
              <Button variant="outline" className="h-auto py-3 flex flex-col gap-1" onClick={() => navigate('/crm/sales/eod-reports')}>
                <Activity className="h-5 w-5 text-red-600" />
                <span className="text-xs">EOD Report</span>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">My Leads Overview</CardTitle>
              <Link to="/crm/sales/my-leads" className="text-sm text-blue-600 hover:underline">View All</Link>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {['Open', 'FollowUp', 'Booked', 'Lost'].map(status => (
                  <div key={status} className="flex-1 bg-gray-50 rounded p-2 text-center">
                    <div className="text-xs text-gray-500 uppercase">{status}</div>
                    <div className="font-bold text-gray-900">{myLeads.filter(l => l.status === status).length}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Recently Assigned</p>
                {myLeads.slice(0, 3).map(lead => (
                  <Link
                    key={lead.id}
                    to={`/crm/sales/lead/${lead.id}`}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="font-medium text-sm">{lead.name}</p>
                      <p className="text-xs text-gray-500">{lead.project} · {lead.phone}</p>
                      {(lead.assignedAt || lead.assigned_at) && (
                        <p className="text-[10px] text-[#8B6914] flex items-center gap-1 mt-0.5">
                          <UserCheck size={10} className="text-[#D4AF37]" />
                          Assigned {(() => { try { return formatDistanceToNow(new Date(lead.assignedAt || lead.assigned_at), { addSuffix: true }); } catch { return ''; } })()}
                        </p>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      lead.status === 'Booked'   ? 'bg-green-100 text-green-700'  :
                      lead.status === 'FollowUp' ? 'bg-yellow-100 text-yellow-700':
                      lead.status === 'Open'     ? 'bg-red-100 text-red-700'      : 'bg-gray-100'
                    }`}>
                      {lead.status}
                    </div>
                  </Link>
                ))}
                {myLeads.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No leads assigned yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <FollowUpReminders />

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-lg">Performance vs Target</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Daily Calls ({callsToday.length}/40)</span>
                  <span>{Math.min(100, Math.round((callsToday.length/40)*100))}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (callsToday.length/40)*100)}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Site Visits ({visitsToday.length}/2)</span>
                  <span>{Math.min(100, Math.round((visitsToday.length/2)*100))}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${Math.min(100, (visitsToday.length/2)*100)}%` }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((act, i) => (
                  <div key={i} className="flex gap-3 text-sm border-b pb-2 last:border-0">
                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${act.type === 'booking' ? 'bg-green-500' : act.type === 'visit' ? 'bg-purple-500' : 'bg-blue-500'}`} />
                    <div>
                      <p className="font-medium">{act.label}</p>
                      <p className="text-xs text-gray-500">{act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
                      <p className="text-xs text-gray-400 truncate w-40">{act.notes || 'No notes'}</p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && <p className="text-sm text-gray-500 text-center">No activity today.</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesExecutiveDashboard;
