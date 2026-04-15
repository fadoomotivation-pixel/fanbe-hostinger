// src/pages/BrokerRegisterPage.jsx
// Accessible broker registration — large text UI for users with weak eyesight
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { brokerRegister, isBrokerAuthenticated, brokerDb } from '@/lib/brokerSupabase';
import { Eye, EyeOff, Loader2, Building2, CheckCircle2, UserPlus } from 'lucide-react';

const BrokerRegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-fill referred-by from URL: ?ref=FNB-05000
  const refParam = searchParams.get('ref') || '';

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [refBy,    setRefBy]    = useState(refParam); // broker_id of referrer e.g. FNB-05000
  const [refName,  setRefName]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isBrokerAuthenticated()) navigate('/broker/payout', { replace: true });
  }, [navigate]);

  // Resolve broker_id → name for referrer confirmation
  useEffect(() => {
    if (!refBy || refBy.length < 5) { setRefName(''); return; }
    const t = setTimeout(async () => {
      const { data } = await brokerDb.from('brokers')
        .select('name').eq('broker_id', refBy.toUpperCase()).maybeSingle();
      setRefName(data?.name || '');
    }, 500);
    return () => clearTimeout(t);
  }, [refBy]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    // Pass broker_id as referralCode — backend will look up by broker_id
    const result = await brokerRegister({ name, email, phone, password, referralBrokerId: refBy.trim().toUpperCase() });
    setLoading(false);

    if (!result.success) { setError(result.message); return; }
    setSuccess(true);
    setTimeout(() => navigate('/broker/payout', { replace: true }), 2000);
  };

  if (success) return (
    <section className="min-h-screen bg-gradient-to-br from-[#0F3A5F] via-[#1a5480] to-[#0d2d4a] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-10 text-center max-w-sm w-full shadow-2xl">
        <CheckCircle2 size={56} className="text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-[#0F3A5F] mb-2">Registration Successful!</h2>
        <p className="text-lg text-gray-500">Redirecting to your dashboard…</p>
      </div>
    </section>
  );

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#0F3A5F] via-[#1a5480] to-[#0d2d4a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-3">
            <Building2 size={40} className="text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Fanbe Group</h1>
          <p className="text-base text-white/60 mt-1">Broker Payout Portal</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-[#0F3A5F]/10 flex items-center justify-center">
              <UserPlus size={22} className="text-[#0F3A5F]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#0F3A5F] leading-none">Create Account</h2>
              <p className="text-sm text-gray-500 mt-0.5">Join Fanbe Broker Network</p>
            </div>
          </div>

          {/* Referrer info banner */}
          {refBy && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              <p className="text-base font-semibold text-amber-800">
                Referred by: <span className="font-black">{refBy}</span>
                {refName && <span className="text-amber-600"> · {refName}</span>}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">Full Name</label>
              <input
                type="text" required autoComplete="name"
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Ramesh Kumar"
                className="w-full h-14 px-5 rounded-xl border-2 border-gray-200 text-lg outline-none focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F] transition font-medium"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">Mobile Number</label>
              <input
                type="tel" required
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full h-14 px-5 rounded-xl border-2 border-gray-200 text-lg outline-none focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F] transition font-medium"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">Email Address</label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-14 px-5 rounded-xl border-2 border-gray-200 text-lg outline-none focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F] transition font-medium"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full h-14 px-5 pr-14 rounded-xl border-2 border-gray-200 text-lg outline-none focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F] transition font-medium"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPw ? <EyeOff size={22}/> : <Eye size={22}/>}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">Confirm Password</label>
              <input
                type={showPw ? 'text' : 'password'} required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full h-14 px-5 rounded-xl border-2 border-gray-200 text-lg outline-none focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F] transition font-medium"
              />
            </div>

            {/* Referral Code (editable) */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-2">
                Referred By <span className="text-gray-400 font-normal">(Broker ID)</span>
              </label>
              <input
                type="text"
                value={refBy} onChange={e => setRefBy(e.target.value.toUpperCase())}
                placeholder="e.g. FNB-05000"
                className="w-full h-14 px-5 rounded-xl border-2 border-gray-200 text-lg outline-none focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F] transition font-medium tracking-wider"
              />
              {refBy && (
                <p className={`text-sm mt-1.5 font-semibold ${ refName ? 'text-emerald-600' : 'text-gray-400' }`}>
                  {refName ? `✓ ${refName}` : 'Enter a valid Broker ID'}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 text-base font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full h-16 bg-[#0F3A5F] hover:bg-[#0a2941] disabled:opacity-60 text-white text-lg font-black rounded-xl transition flex items-center justify-center gap-3 mt-2">
              {loading && <Loader2 size={22} className="animate-spin" />}
              {loading ? 'Creating Account…' : 'Create My Account'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-base text-gray-500">
              Already have an account?{' '}
              <Link to="/broker/login" className="font-bold text-[#0F3A5F] hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-white/30 mt-6">
          © {new Date().getFullYear()} Fanbe Group. All rights reserved.
        </p>
      </div>
    </section>
  );
};

export default BrokerRegisterPage;
