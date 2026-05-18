// src/crm/pages/Attendance.jsx
// Employee attendance page — GPS-verified punch in/out with selfie capture
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
// Use the regular (authenticated) supabase client — NOT supabase.
// The attendance RLS policies allow `authenticated` role only; supabase
// is created with persistSession:false so its requests go as anon, which RLS
// blocks. Net effect was: INSERT/UPDATE on attendance silently failed.
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  LogIn, LogOut, MapPin, Camera, Clock, CheckCircle2,
  AlertCircle, Loader2, Calendar, TrendingUp, Timer, Wifi
} from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const toHHMM = (minutes) => {
  if (!minutes || minutes < 0) return '0h 0m';
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

/* ─────────────────────────────────────────────
   CAMERA COMPONENT
───────────────────────────────────────────── */
const SelfieCapture = ({ onCapture, onSkip }) => {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; setReady(true); }
      })
      .catch(() => setError('Camera not available'));
    return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, []);

  const capture = () => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    canvas.width  = 320;
    canvas.height = 240;
    canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCapture(dataUrl);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {error ? (
        <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
          <Camera size={32} className="text-gray-200" />
          <p className="text-xs">{error}</p>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={onSkip}>Skip Selfie</Button>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-[280px] rounded-2xl overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full" />
            {!ready && <div className="absolute inset-0 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-white" /></div>}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2 w-full max-w-[280px]">
            <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={onSkip}>Skip</Button>
            <Button size="sm" disabled={!ready}
              className="flex-1 rounded-xl bg-[#0F3A5F] hover:bg-[#0a2d4d] text-white font-bold"
              onClick={capture}>
              <Camera size={14} className="mr-1" />Capture
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const Attendance = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [punching, setPunching]       = useState(false);
  const [step, setStep]               = useState('idle'); // idle | gps | selfie | confirm
  const [gpsData, setGpsData]         = useState(null);
  const [selfieData, setSelfieData]   = useState(null);
  const [liveTime, setLiveTime]       = useState(new Date());
  const [gpsError, setGpsError]       = useState('');

  const userId   = user?.uid || user?.id;
  const todayStr = new Date().toISOString().split('T')[0];

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* fetch today + history */
  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: today } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', userId)
        .eq('date', todayStr)
        .maybeSingle();
      setTodayRecord(today || null);

      const { data: hist } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', userId)
        .order('date', { ascending: false })
        .limit(14);
      setHistory(hist || []);
    } catch (err) {
      console.error('[Attendance] fetchData error:', err);
    }
    setLoading(false);
  }, [userId, todayStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* Step 1: get GPS */
  const startPunch = () => {
    setStep('gps');
    setGpsError('');
    setGpsData(null);
    setSelfieData(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
        setStep('selfie');
      },
      (err) => {
        setGpsError('Location denied. Please enable GPS and try again.');
        setStep('idle');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  /* Step 2: selfie captured/skipped → confirm */
  const onSelfie = (dataUrl) => { setSelfieData(dataUrl); setStep('confirm'); };
  const onSkipSelfie = ()      => { setSelfieData(null);  setStep('confirm'); };

  /* Step 3: confirm punch */
  const confirmPunch = async () => {
    setPunching(true);
    const now  = new Date();
    const nowISO = now.toISOString();
    const isPunchIn = !todayRecord || (todayRecord.punch_in && !todayRecord.punch_out);

    try {
      if (!todayRecord) {
        // First punch = clock IN
        const { error } = await supabase.from('attendance').insert({
          employee_id:       userId,
          employee_name:     user?.name || user?.username || 'Employee',
          date:              todayStr,
          punch_in:          nowISO,
          punch_in_lat:      gpsData.lat,
          punch_in_lng:      gpsData.lng,
          punch_in_accuracy: gpsData.accuracy,
          punch_in_selfie:   selfieData || null,
          status:            'pending',
        });
        if (error) throw new Error(error.message);
        toast({ title: '✅ Clocked In!', description: `${format(now, 'hh:mm a')} — GPS recorded` });
      } else if (todayRecord.punch_in && !todayRecord.punch_out) {
        // Clock OUT
        const mins = differenceInMinutes(now, parseISO(todayRecord.punch_in));
        const status = mins >= 480 ? 'present' : mins >= 240 ? 'half_day' : 'present';
        const { error } = await supabase.from('attendance').update({
          punch_out:          nowISO,
          punch_out_lat:      gpsData.lat,
          punch_out_lng:      gpsData.lng,
          punch_out_accuracy: gpsData.accuracy,
          punch_out_selfie:   selfieData || null,
          total_minutes:      mins,
          status,
        }).eq('id', todayRecord.id);
        if (error) throw new Error(error.message);
        toast({ title: '✅ Clocked Out!', description: `${toHHMM(mins)} worked today` });
      }
      await fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setPunching(false);
    setStep('idle');
  };

  /* derived state */
  const isClockedIn  = todayRecord?.punch_in && !todayRecord?.punch_out;
  const isClockedOut = todayRecord?.punch_in && todayRecord?.punch_out;
  const liveMinutes  = isClockedIn
    ? differenceInMinutes(liveTime, parseISO(todayRecord.punch_in))
    : (todayRecord?.total_minutes || 0);

  const thisWeek = history.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now); monday.setDate(now.getDate() - day + 1);
    return d >= monday;
  });
  const weekMinutes = thisWeek.reduce((s, r) => s + (r.total_minutes || 0), 0);
  const presentDays = history.filter(r => r.status === 'present').length;

  /* ── RENDER ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#1B6CA8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-3 md:p-5 pb-24" style={{ fontFamily: "'Inter',sans-serif" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-2">
        <div>
          <h1 className="text-xl font-black text-[#0F3A5F] flex items-center gap-2">
            <Clock size={20} className="text-[#1B6CA8]" />My Attendance
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">{format(liveTime, 'EEEE, dd MMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <Wifi size={12} className="text-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-600">GPS Live</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col gap-0.5">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Today</p>
          <p className="text-lg font-black text-[#0F3A5F]">{toHHMM(liveMinutes)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col gap-0.5">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">This Week</p>
          <p className="text-lg font-black text-[#0F3A5F]">{toHHMM(weekMinutes)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col gap-0.5">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Present</p>
          <p className="text-lg font-black text-[#0F3A5F]">{presentDays}d</p>
        </div>
      </div>

      {/* Today Status Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="h-1 bg-gradient-to-r from-[#0F3A5F] to-[#1B6CA8]" />
        <div className="p-4">

          {/* Live Clock */}
          <div className="text-center mb-4">
            <p className="text-5xl font-black text-[#0F3A5F] tabular-nums tracking-tight">
              {format(liveTime, 'HH:mm')}
              <span className="text-2xl text-gray-300">:{format(liveTime, 'ss')}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isClockedIn ? (
                <span className="text-emerald-600 font-semibold">🟢 Working — {toHHMM(liveMinutes)} so far</span>
              ) : isClockedOut ? (
                <span className="text-blue-600 font-semibold">✅ Done for today — {toHHMM(liveMinutes)} worked</span>
              ) : (
                <span className="text-gray-400">Not punched in yet</span>
              )}
            </p>
          </div>

          {/* Punch In/Out Info */}
          {todayRecord && (
            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-emerald-50 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Clock In</p>
                <p className="text-sm font-black text-emerald-700">
                  {todayRecord.punch_in ? format(parseISO(todayRecord.punch_in), 'hh:mm a') : '—'}
                </p>
                {todayRecord.punch_in_lat && (
                  <p className="text-[10px] text-emerald-500 flex items-center justify-center gap-0.5 mt-0.5">
                    <MapPin size={9} />GPS {todayRecord.punch_in_accuracy}m
                  </p>
                )}
              </div>
              <div className="flex-1 bg-blue-50 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Clock Out</p>
                <p className="text-sm font-black text-blue-700">
                  {todayRecord.punch_out ? format(parseISO(todayRecord.punch_out), 'hh:mm a') : '—'}
                </p>
                {todayRecord.punch_out_lat && (
                  <p className="text-[10px] text-blue-500 flex items-center justify-center gap-0.5 mt-0.5">
                    <MapPin size={9} />GPS {todayRecord.punch_out_accuracy}m
                  </p>
                )}
              </div>
            </div>
          )}

          {/* GPS Error */}
          {gpsError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl mb-3">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{gpsError}</p>
            </div>
          )}

          {/* STEP: Getting GPS */}
          {step === 'gps' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={28} className="animate-spin text-[#1B6CA8]" />
              <p className="text-sm font-semibold text-gray-600">Fetching your location…</p>
              <p className="text-xs text-gray-400">Please allow location access</p>
            </div>
          )}

          {/* STEP: Selfie */}
          {step === 'selfie' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                <MapPin size={13} className="text-green-500" />
                <span className="text-xs font-semibold text-green-700">
                  GPS ✓ — {gpsData?.lat?.toFixed(5)}, {gpsData?.lng?.toFixed(5)}
                  <span className="text-green-400 font-normal ml-1">(±{gpsData?.accuracy}m)</span>
                </span>
              </div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide text-center">Take a Selfie (optional)</p>
              <SelfieCapture onCapture={onSelfie} onSkip={onSkipSelfie} />
            </div>
          )}

          {/* STEP: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                <MapPin size={13} className="text-green-500" />
                <span className="text-xs font-semibold text-green-700">
                  {gpsData?.lat?.toFixed(5)}, {gpsData?.lng?.toFixed(5)} (±{gpsData?.accuracy}m)
                </span>
              </div>
              {selfieData && (
                <div className="flex justify-center">
                  <img src={selfieData} alt="selfie" className="w-20 h-16 rounded-xl object-cover border border-gray-200" />
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep('idle')} disabled={punching}>Cancel</Button>
                <Button disabled={punching}
                  className={`flex-1 rounded-xl font-black text-white ${
                    isClockedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  onClick={confirmPunch}>
                  {punching
                    ? <><Loader2 size={14} className="animate-spin mr-1" />Saving…</>
                    : isClockedIn
                      ? <><LogOut size={14} className="mr-1" />Confirm Clock Out</>
                      : <><LogIn size={14} className="mr-1" />Confirm Clock In</>}
                </Button>
              </div>
            </div>
          )}

          {/* MAIN PUNCH BUTTON */}
          {step === 'idle' && !isClockedOut && (
            <Button
              onClick={startPunch}
              className={`w-full h-14 rounded-2xl font-black text-base text-white shadow-lg active:scale-95 transition-transform ${
                isClockedIn ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}>
              {isClockedIn
                ? <><LogOut size={20} className="mr-2" />Clock Out<span className="text-xs font-normal ml-2 opacity-75">GPS Required</span></>
                : <><LogIn size={20} className="mr-2" />Clock In<span className="text-xs font-normal ml-2 opacity-75">GPS Required</span></>}
            </Button>
          )}

          {step === 'idle' && isClockedOut && (
            <div className="flex items-center justify-center gap-2 py-3 bg-blue-50 rounded-xl">
              <CheckCircle2 size={18} className="text-blue-500" />
              <span className="text-sm font-bold text-blue-700">Attendance marked for today ✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History — last 14 days */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Calendar size={15} className="text-[#1B6CA8]" />
          <h2 className="text-sm font-black text-gray-800">Last 14 Days</h2>
          <span className="ml-auto text-[11px] text-gray-400">{history.length} records</span>
        </div>
        {history.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-gray-300">
            <Clock size={28} className="mb-2" />
            <p className="text-xs">No attendance records yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {history.map((rec) => {
              const m = STATUS_META[rec.status] || STATUS_META.pending;
              let inStr  = '—'; try { inStr  = format(parseISO(rec.punch_in), 'hh:mm a');  } catch {}
              let outStr = '—'; try { outStr = format(parseISO(rec.punch_out), 'hh:mm a'); } catch {}
              let dateLabel = rec.date;
              try { dateLabel = format(parseISO(rec.date), 'EEE, dd MMM'); } catch {}
              return (
                <li key={rec.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.dot }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">{dateLabel}</p>
                    <p className="text-[10px] text-gray-400">{inStr} → {outStr}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black text-gray-700">{toHHMM(rec.total_minutes)}</p>
                    <span style={{ background: m.bg, color: m.text, border: `1px solid ${m.border}` }}
                      className="inline-block px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                      {m.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Attendance;
