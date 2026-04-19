// src/pages/BrokerLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { brokerLogin, isBrokerAuthenticated } from '@/lib/brokerSupabase';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Loader2, Building2, ShieldCheck, ChevronRight } from 'lucide-react';

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
    if (isBrokerAuthenticated()) navigate('/broker/payout', { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = await brokerLogin(email, password);
    setLoading(false);
    if (!result.success) { setError(result.message); return; }

    // Check admin role
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const role =
        session?.user?.app_metadata?.role ||
        session?.user?.user_metadata?.role;
      if (ADMIN_ROLES.includes(role)) {
        navigate('/broker/admin', { replace: true });
        return;
      }
    } catch (_) { /* fall through */ }

    const redirect = location.state?.from?.pathname || '/broker/payout';
    navigate(redirect, { replace: true });
  };

  return (
    <>
      {/* Minimal top nav */}
      <nav className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-[#0F3A5F]/95 px-5 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <Building2 size={20} className="text-[#D4AF37]" />
          <span className="text-sm font-bold text-white">Fanbe Group</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xs text-white/60 hover:text-white transition">Home</Link>
          <Link to="/projects" className="text-xs text-white/60 hover:text-white transition">Projects</Link>
          <Link to="/contact" className="text-xs text-white/60 hover:text-white transition">Contact</Link>
          <Link
            to="/broker/register"
            className="rounded-full bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#0F3A5F] hover:bg-[#c9a82e] transition"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Page */}
      <section className="min-h-screen bg-gradient-to-br from-[#0F3A5F] via-[#1a5480] to-[#0d2d4a] flex items-center justify-center px-4 pb-12 pt-24">
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
                {loading ? 'Signing in\u2026' : 'Login to Portal'}
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
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a2133] py-8 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={18} className="text-[#D4AF37]" />
              <span className="text-sm font-bold text-white">Fanbe Group</span>
            </div>
            <div className="flex gap-5">
              <Link to="/" className="text-xs text-white/50 hover:text-white transition">Home</Link>
              <Link to="/projects" className="text-xs text-white/50 hover:text-white transition">Projects</Link>
              <Link to="/contact" className="text-xs text-white/50 hover:text-white transition">Contact</Link>
              <Link to="/broker/register" className="text-xs text-white/50 hover:text-white transition">Register as Broker</Link>
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-4 text-center">
            <p className="text-xs text-white/30">
              \u00a9 {new Date().getFullYear()} Fanbe Group. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default BrokerLoginPage;
