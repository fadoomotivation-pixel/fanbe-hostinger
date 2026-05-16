// src/crm/pages/AttendanceAdmin.jsx
// Admin / HR / Sub-Admin view — see all employee attendance, GPS map links, selfies
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import {
  Clock, MapPin, Search, X, Loader2, Calendar, Download,
  TrendingUp, Users, CheckCircle2, AlertCircle, ChevronDown,
  Camera, Navigation, Filter
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const toHHMM = (minutes) => {
  if (!minutes || minutes < 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const STATUS_META = {
  present:  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', dot: '#22C55E', label: 'Present' },
  half_day: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A', dot: '#F59E0B', label: 'Half Day' },
  absent:   { bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444', label: 'Absent' },
  pending:  { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6', label: 'Clocked In' },
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.absent;
  return (
    <span style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}` }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
      {m.label}
    </span>
  );
};

const GpsLink = ({ lat, lng, accuracy, label }) => {
  if (!lat || !lng) return <span className="text-gray-300 text-xs">—</span>;
  return (
    <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium underline">
      <Navigation size={11} />{label}
      {accuracy && <span className="text-gray-400 text-[10px] font-normal">±{accuracy}m</span>}
    </a>
  );
};

/* ─────────────────────────────────────────────
   RECORD ROW — expandable
───────────────────────────────────────────── */
const RecordRow = ({ rec }) => {
  const [expanded, setExpanded] = useState(false);
  const [selfieOpen, setSelfieOpen] = useState(null); // 'in' | 'out' | null

  let inStr  = '—'; try { inStr  = format(parseISO(rec.punch_in), 'hh:mm a'); } catch {}
  let outStr = '—'; try { outStr = format(parseISO(rec.punch_out), 'hh:mm a'); } catch {}
  let dateStr = rec.date; try { dateStr = format(parseISO(rec.date), 'dd MMM'); } catch {}

  return (
    <>
      <tr className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer ${
        expanded ? 'bg-blue-50/50' : ''
      }`} onClick={() => setExpanded(e => !e)}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: 'linear-gradient(135deg,#0F3A5F,#1B6CA8)' }}>
              {(rec.employee_name || 'E').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">{rec.employee_name || '—'}</p>
              <p className="text-[10px] text-gray-400">{dateStr}</p>
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-xs font-semibold text-emerald-700">{inStr}</td>
        <td className="px-3 py-3 text-xs font-semibold text-blue-700">{outStr}</td>
        <td className="px-3 py-3 text-xs font-bold text-gray-700 tabular-nums">{toHHMM(rec.total_minutes)}</td>
        <td className="px-3 py-3"><StatusBadge status={rec.status} /></td>
        <td className="px-3 py-3">
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </td>
      </tr>

      {expanded && (
        <tr className="bg-blue-50/30">
          <td colSpan={6} className="px-4 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Punch In GPS</p>
                <GpsLink lat={rec.punch_in_lat} lng={rec.punch_in_lng} accuracy={rec.punch_in_accuracy} label="View Map" />
              </div>
              <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Punch Out GPS</p>
                <GpsLink lat={rec.punch_out_lat} lng={rec.punch_out_lng} accuracy={rec.punch_out_accuracy} label="View Map" />
              </div>
              {rec.punch_in_selfie && (
                <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">In Selfie</p>
                  <button onClick={e => { e.stopPropagation(); setSelfieOpen('in'); }}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Camera size={11} />View Photo
                  </button>
                </div>
              )}
              {rec.punch_out_selfie && (
                <div className="bg-white rounded-xl p-2.5 border border-gray-100">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Out Selfie</p>
                  <button onClick={e => { e.stopPropagation(); setSelfieOpen('out'); }}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                    <Camera size={11} />View Photo
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Selfie Modal */}
      {selfieOpen && (
        <tr><td colSpan={6}>
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => setSelfieOpen(null)}>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-xs w-full">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <p className="font-bold text-sm text-gray-800">
                  {selfieOpen === 'in' ? '🟢 Punch In' : '🔵 Punch Out'} Selfie — {rec.employee_name}
                </p>
                <button onClick={() => setSelfieOpen(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
              </div>
              <img
                src={selfieOpen === 'in' ? rec.punch_in_selfie : rec.punch_out_selfie}
                alt="selfie" className="w-full" />
            </div>
          </div>
        </td></tr>
      )}
    </>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const AttendanceAdmin = () => {
  const { user } = useAuth();
  const [records, setRecords]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo,   setDateTo]   = useState(format(new Date(), 'yyyy-MM-dd'));
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabaseAdmin
        .from('attendance')
        .select('*')
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false })
        .order('punch_in', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      setRecords(data || []);
    } catch (err) {
      console.error('[AttendanceAdmin] fetch error:', err);
    }
    setLoading(false);
  }, [dateFrom, dateTo, statusFilter]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  /* Realtime */
  useEffect(() => {
    const ch = supabaseAdmin
      .channel('realtime:attendance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, fetchRecords)
      .subscribe();
    return () => supabaseAdmin.removeChannel(ch);
  }, [fetchRecords]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return records;
    return records.filter(r => r.employee_name?.toLowerCase().includes(q));
  }, [records, search]);

  /* Stats */
  const todayStr    = new Date().toISOString().split('T')[0];
  const todayRecs   = records.filter(r => r.date === todayStr);
  const presentToday = todayRecs.filter(r => r.status === 'present' || r.status === 'pending').length;
  const absentToday  = todayRecs.filter(r => r.status === 'absent').length;
  const totalHours   = records.reduce((s, r) => s + (r.total_minutes || 0), 0);

  /* CSV Export */
  const exportCSV = () => {
    const rows = [
      ['Employee', 'Date', 'Punch In', 'Punch Out', 'Hours', 'Status', 'In Lat', 'In Lng', 'Out Lat', 'Out Lng'],
      ...filtered.map(r => [
        r.employee_name || '',
        r.date,
        r.punch_in ? format(parseISO(r.punch_in), 'HH:mm:ss') : '',
        r.punch_out ? format(parseISO(r.punch_out), 'HH:mm:ss') : '',
        r.total_minutes ? (r.total_minutes / 60).toFixed(2) : '0',
        r.status || '',
        r.punch_in_lat || '', r.punch_in_lng || '',
        r.punch_out_lat || '', r.punch_out_lng || '',
      ])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `attendance_${dateFrom}_${dateTo}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-3 md:p-5" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <h1 className="text-xl font-black text-[#0F3A5F] flex items-center gap-2">
            <Clock size={20} className="text-[#1B6CA8]" />Attendance Management
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">GPS-verified • Real-time updates</p>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm" className="rounded-xl border-gray-200 text-xs font-bold">
          <Download size={13} className="mr-1" />Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Today Present</p>
          <p className="text-2xl font-black text-emerald-600">{presentToday}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Today Absent</p>
          <p className="text-2xl font-black text-red-500">{absentToday}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Records</p>
          <p className="text-2xl font-black text-[#0F3A5F]">{records.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Hours</p>
          <p className="text-2xl font-black text-[#1B6CA8]">{Math.round(totalHours / 60)}h</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employee…"
              className="w-full pl-8 pr-7 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X size={12} className="text-gray-400" /></button>}
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-2 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-2 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none font-medium">
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
            <option value="pending">Clocked In</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-800">Attendance Records</h2>
          <div className="flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin text-gray-400" />}
            <span className="text-[11px] text-gray-400">{filtered.length} records</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Employee</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">In</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Out</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hours</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-3 py-2.5 w-8" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && !loading ? (
                <tr><td colSpan={6}>
                  <div className="flex flex-col items-center py-14 text-gray-300">
                    <Clock size={32} className="mb-2" />
                    <p className="text-sm">No records found</p>
                  </div>
                </td></tr>
              ) : filtered.map((rec) => (
                <RecordRow key={rec.id} rec={rec} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceAdmin;
