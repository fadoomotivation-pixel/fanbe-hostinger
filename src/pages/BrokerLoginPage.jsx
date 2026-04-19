// src/pages/BrokerLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { brokerLogin, isBrokerAuthenticated } from '@/lib/brokerSupabase';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, Building2, ShieldCheck } from 'lucide-react';

const ADMIN_ROLES = ['admin', 'super_admin', 'finance_admin', 'broker_admin'];

const BrokerLoginPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    // If already authenticated as broker, send to payout
    if (isBrokerAuthenticated()) navigate('/broker/payout', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);

    const result = await brokerLogin(email, password);
    setLoading(false);

    if (!result.success) { setError(result.message); return; }

    // Check if user has admin role in Supabase metadata
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const role =
        session?.user?.app_metadata?.role ||
        session?.user?.user_metadata?.role;

      if (ADMIN_ROLES.includes(role)) {
        // Admin users go to admin panel
        navigate('/broker/admin', { replace: true });
        return;
      }
    } catch (_) {
      // If session check fails, fall through to normal broker redirect
    }

    // Regular brokers go to payout portal
    const redirect = location.state?.from?.pathname || '/broker/payout';
    navigate(redirect, { replace: true });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#0F3A5F] via-[#1a5480] to-[#0d2d4a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-3">
            <Building2 size={32} className="text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Fanbe Group</h1>
          <p className="text-sm text-white/60 mt-1">Broker Payout Portal</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-[#0F3A5F] mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-6">Sign in with your registered email</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#0F3A5F]/20 focus:border-[#0F3A5F] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-[#0F3A5F]/20 focus:border-[#0F3A5F] transition"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full h-12 bg-[#0F3A5F] hover:bg-[#0a2941] disabled:opacity-60 text-white font-bold rounded-xl transition flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Login to Portal'}
            </button>
          </form>

          {/* Admin hint */}
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#0F3A5F]/5 px-4 py-3">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#0F3A5F]/60" />
            <p className="text-xs text-[#0F3A5F]/60">
              Admin users are automatically redirected to the Admin Panel after login.
            </p>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              New broker?{' '}
              <Link to="/broker/register" className="font-semibold text-[#0F3A5F] hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          © {new Date().getFullYear()} Fanbe Group. All rights reserved.
        </p>
      </div>
    </section>
  );
};

export default BrokerLoginPage;
