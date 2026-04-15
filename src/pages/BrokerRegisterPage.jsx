// src/pages/BrokerRegisterPage.jsx — New broker signup with optional referral code
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { brokerRegister, isBrokerAuthenticated } from '@/lib/brokerSupabase';
import { Eye, EyeOff, Loader2, Building2, CheckCircle2 } from 'lucide-react';

const BrokerRegisterPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', confirm: '',
    referralCode: params.get('ref') || '',
  });
  const [showPw,  setShowPw]  = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  useEffect(() => {
    if (isBrokerAuthenticated()) navigate('/broker/payout', { replace: true });
  }, [navigate]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const result = await brokerRegister({
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),
      phone: form.phone.trim(),
      password: form.password,
      referralCode: form.referralCode.trim() || null,
    });
    setLoading(false);
    if (!result.success) { setError(result.message); return; }
    setDone(true);
    setTimeout(() => navigate('/broker/payout', { replace: true }), 1800);
  };

  if (done) return (
    <section className="min-h-screen bg-gradient-to-br from-[#0F3A5F] via-[#1a5480] to-[#0d2d4a] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
        <CheckCircle2 size={52} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#0F3A5F] mb-2">Account Created!</h2>
        <p className="text-sm text-gray-500">Redirecting to your dashboard…</p>
      </div>
    </section>
  );

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#0F3A5F] via-[#1a5480] to-[#0d2d4a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-3">
            <Building2 size={32} className="text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-black text-white">Join as Broker</h1>
          <p className="text-sm text-white/60 mt-1">Fanbe Group Payout Network</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
              <input required value={form.name} onChange={set('name')} placeholder="Ravi Kumar"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#0F3A5F]/20 focus:border-[#0F3A5F] transition" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
              <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#0F3A5F]/20 focus:border-[#0F3A5F] transition" />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="9876543210"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#0F3A5F]/20 focus:border-[#0F3A5F] transition" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                  placeholder="Min 6 characters"
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#0F3A5F]/20 focus:border-[#0F3A5F] transition" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password *</label>
              <input type="password" required value={form.confirm} onChange={set('confirm')} placeholder="Re-enter password"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#0F3A5F]/20 focus:border-[#0F3A5F] transition" />
            </div>

            {/* Referral code */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Referral Code
                <span className="ml-1 text-xs font-normal text-gray-400">(optional — from your upline broker)</span>
              </label>
              <input value={form.referralCode} onChange={set('referralCode')} placeholder="e.g. RAVI3X9K"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm uppercase tracking-wider outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] transition" />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium text-red-600">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-[#0F3A5F] hover:bg-[#0a2941] disabled:opacity-60 text-white font-bold rounded-xl transition flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating account…' : 'Create Broker Account'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/broker/login" className="font-semibold text-[#0F3A5F] hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrokerRegisterPage;
