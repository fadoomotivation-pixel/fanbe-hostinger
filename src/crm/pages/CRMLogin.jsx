
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Lock, User, Key, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ROLES } from '@/lib/permissions';
import { initializeUserDatabase } from '@/lib/authUtils';

const CRMLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    initializeUserDatabase();
    
    // Redirect if already authenticated
    if (isAuthenticated && user) {
       handleRedirect(user.role);
    }
  }, [isAuthenticated, user]);

  const handleRedirect = (role) => {
    // Check if there's a return url
    const from = location.state?.from?.pathname;
    if (from && !from.includes('/login')) {
      navigate(from, { replace: true });
      return;
    }

    // Default redirects
    switch (role) {
      case ROLES.SUPER_ADMIN:
        navigate('/crm/admin/dashboard', { replace: true });
        break;
      case ROLES.SUB_ADMIN:
        navigate('/crm/admin/dashboard', { replace: true });
        break;
      case ROLES.MANAGER:
        navigate('/crm/admin/dashboard', { replace: true });
        break;
      case ROLES.SALES_EXECUTIVE:
        navigate('/crm/sales/dashboard', { replace: true });
        break;
      default:
        navigate('/crm/sales/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        toast({ title: 'Welcome Back!', description: `Logged in successfully` });
        handleRedirect(result.role);
      } else {
        setError(result.message || 'Invalid credentials');
        toast({ title: 'Login Failed', description: result.message || 'Invalid credentials', variant: 'destructive' });
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      setError('Login failed. Please try again.');
      toast({ title: 'Login Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = username.length >= 3 && password.length >= 6;

  return (
    <div className="min-h-screen bg-[#0F3A5F] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-purple-600 absolute top-0 left-0"></div>
        
        <div className="p-8 text-center bg-gray-50 border-b relative">
           <img 
            src="https://horizons-cdn.hostinger.com/a5c23928-0ade-41f6-9dc0-f43342fe6739/0944d6d7630214fc8ea9ee8e7243badb.jpg"
            alt="Fanbe Group"
            className="h-20 w-20 rounded-full mx-auto mb-4 object-cover ring-4 ring-[#0F3A5F]/10"
          />
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Fanbe CRM</h1>
          <p className="text-gray-500 text-sm mt-1">Authorized Personnel Only</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Username / ID</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0F3A5F] outline-none transition-all"
                placeholder="Enter your username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-2 border rounded-lg focus:ring-2 focus:ring-[#0F3A5F] outline-none transition-all"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none p-1 min-h-[24px] min-w-[24px] flex items-center justify-center"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex justify-end">
              <Link 
                to="/forgot-password" 
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !isFormValid}
            className="w-full bg-[#0F3A5F] hover:bg-[#0a2742] py-6 text-lg font-bold shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? <><Loader2 className="animate-spin mr-2" /> Verifying...</> : 'Secure Login'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CRMLogin;
