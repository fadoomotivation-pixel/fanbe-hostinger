
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Mail, ShieldCheck, CheckCircle2, AlertCircle, 
  Loader2, Eye, EyeOff, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  findUser, generateVerificationCode, verifyResetCode, 
  updateUserPassword, clearResetContext 
} from '@/lib/authUtils';
import { sendEmail } from '@/lib/emailService';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1: User Lookup
  const [identifier, setIdentifier] = useState('');
  const [user, setUser] = useState(null);

  // Step 2: Verification Code
  const [code, setCode] = useState('');
  const [expiryTime, setExpiryTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Step 3: New Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Timer Logic for Step 2
  useEffect(() => {
    let interval;
    if (step === 2 && expiryTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = expiryTime - now;
        
        if (diff <= 0) {
          setTimeLeft('Expired');
          setError('Code expired. Please resend.');
          clearInterval(interval);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, expiryTime]);

  // --- Handlers ---

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Find User
      const foundUser = findUser(identifier);
      if (!foundUser) {
        setError('User not found. Please check your username or email.');
        setLoading(false);
        return;
      }
      setUser(foundUser);

      // 2. Generate Code
      const verificationCode = generateVerificationCode(foundUser.id);
      
      // 3. Send Email
      await sendEmail({
        recipientEmail: foundUser.email,
        subject: 'Password Reset Code - Fanbe Group',
        templateName: 'passwordResetCode',
        templateParams: {
          name: foundUser.name,
          code: verificationCode
        }
      });

      // 4. Update State
      setExpiryTime(Date.now() + 10 * 60 * 1000); // 10 mins
      setStep(2);
      toast({ title: 'Code Sent', description: `Verification code sent to ${foundUser.email}` });

    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const result = verifyResetCode(code);
      if (result.valid) {
        setStep(3);
        toast({ title: 'Verified', description: 'Code verified successfully.' });
      } else {
        setError(result.reason || 'Invalid code');
      }
      setLoading(false);
    }, 800);
  };

  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setError('');

    // Final validation just in case
    if (passwordStrength(newPassword) !== 'Strong' && passwordStrength(newPassword) !== 'Good') {
      setError('Password is too weak.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    setTimeout(async () => {
      // Update Password
      updateUserPassword(user.id, newPassword);
      
      // Send Confirmation
      await sendEmail({
        recipientEmail: user.email,
        subject: 'Password Reset Successful',
        templateName: 'passwordResetSuccess',
        templateParams: { name: user.name }
      });

      // Clear Context
      clearResetContext();
      
      setStep(4);
      setLoading(false);
      
      // Auto redirect
      setTimeout(() => navigate('/crm/login'), 3000);
    }, 1000);
  };

  const handleResendCode = async () => {
    if (!user) return;
    setLoading(true);
    const newCode = generateVerificationCode(user.id);
    await sendEmail({
       recipientEmail: user.email,
       subject: 'New Password Reset Code',
       templateName: 'passwordResetCode',
       templateParams: { name: user.name, code: newCode }
    });
    setExpiryTime(Date.now() + 10 * 60 * 1000);
    setLoading(false);
    toast({ title: 'Code Resent', description: 'Check your email inbox.' });
  };

  // --- Password Strength Logic ---
  const passwordStrength = (pwd) => {
    if (!pwd) return 'None';
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score < 3) return 'Weak';
    if (score === 3 || score === 4) return 'Good';
    if (score === 5) return 'Strong';
    return 'Weak';
  };

  const getStrengthColor = (strength) => {
    switch(strength) {
      case 'Weak': return 'bg-red-500';
      case 'Good': return 'bg-yellow-500';
      case 'Strong': return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-[#0F3A5F]">
        <CardHeader className="text-center pb-2">
           <CardTitle className="text-xl text-[#0F3A5F]">Reset Password</CardTitle>
           {step < 4 && (
             <div className="mt-4 flex items-center justify-between px-8">
               {[1, 2, 3, 4].map(s => (
                 <div key={s} className="flex flex-col items-center">
                   <div className={`
                     w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                     ${step >= s ? 'bg-[#0F3A5F] text-white' : 'bg-gray-200 text-gray-500'}
                   `}>
                     {step > s ? <CheckCircle2 size={16} /> : s}
                   </div>
                   <span className="text-[10px] mt-1 text-gray-400">
                     {s === 1 ? 'Find' : s === 2 ? 'Verify' : s === 3 ? 'Reset' : 'Done'}
                   </span>
                 </div>
               ))}
               <div className="absolute top-[88px] left-[70px] right-[70px] h-0.5 bg-gray-200 -z-10">
                 <div 
                   className="h-full bg-[#0F3A5F] transition-all duration-500" 
                   style={{ width: `${((step - 1) / 3) * 100}%` }}
                 ></div>
               </div>
             </div>
           )}
        </CardHeader>
        
        <CardContent className="pt-6">
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Username or Email Address</Label>
                <div className="relative">
                   <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                   <Input 
                      placeholder="Enter username or email" 
                      className="pl-9"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                   />
                </div>
                <p className="text-xs text-gray-500">
                  We'll send a verification code to the email associated with your account.
                </p>
              </div>
              
              {error && <div className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {error}</div>}
              
              <Button type="submit" className="w-full bg-[#0F3A5F]" disabled={loading || !identifier}>
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Send Verification Code'}
              </Button>
              
              <div className="text-center">
                <Link to="/crm/login" className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1">
                   <ArrowLeft size={12} /> Back to Login
                </Link>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
               <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">Enter the 6-digit code sent to</p>
                  <p className="font-medium text-[#0F3A5F]">{user?.email}</p>
               </div>

               <div className="space-y-2">
                 <Label>Verification Code</Label>
                 <Input 
                   className="text-center text-2xl tracking-widest" 
                   maxLength={6}
                   placeholder="000000"
                   value={code}
                   onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                 />
                 <div className="flex justify-between text-xs mt-1">
                    <span className={timeLeft === 'Expired' ? 'text-red-500' : 'text-gray-500'}>
                      Expires in: {timeLeft}
                    </span>
                    <button 
                      type="button" 
                      onClick={handleResendCode} 
                      className="text-blue-600 hover:underline"
                      disabled={loading}
                    >
                      Resend Code
                    </button>
                 </div>
               </div>

               {error && <div className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {error}</div>}

               <Button type="submit" className="w-full bg-[#0F3A5F]" disabled={loading || code.length !== 6}>
                 {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Verify Code'}
               </Button>
               
               <div className="text-center">
                 <button type="button" onClick={() => setStep(1)} className="text-xs text-gray-500 hover:text-gray-800">
                   Change Email/Username
                 </button>
               </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label>New Password</Label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                     <Input 
                       type={showPassword ? "text" : "password"} 
                       className="pl-9 pr-9"
                       placeholder="••••••••"
                       value={newPassword}
                       onChange={(e) => setNewPassword(e.target.value)}
                     />
                     <button 
                       type="button"
                       className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                       onClick={() => setShowPassword(!showPassword)}
                     >
                       {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                   </div>
                   
                   {/* Strength Meter */}
                   {newPassword && (
                     <div className="space-y-1">
                       <div className="flex gap-1 h-1">
                          <div className={`flex-1 rounded-full ${['Weak','Good','Strong'].includes(passwordStrength(newPassword)) ? getStrengthColor(passwordStrength(newPassword)) : 'bg-gray-200'}`}></div>
                          <div className={`flex-1 rounded-full ${['Good','Strong'].includes(passwordStrength(newPassword)) ? getStrengthColor(passwordStrength(newPassword)) : 'bg-gray-200'}`}></div>
                          <div className={`flex-1 rounded-full ${['Strong'].includes(passwordStrength(newPassword)) ? getStrengthColor(passwordStrength(newPassword)) : 'bg-gray-200'}`}></div>
                       </div>
                       <p className="text-[10px] text-right text-gray-500">{passwordStrength(newPassword)}</p>
                     </div>
                   )}
                 </div>

                 <div className="space-y-2">
                   <Label>Confirm Password</Label>
                   <div className="relative">
                     <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                     <Input 
                       type={showPassword ? "text" : "password"} 
                       className="pl-9"
                       placeholder="••••••••"
                       value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)}
                     />
                   </div>
                 </div>

                 {/* Requirements */}
                 <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <p className="text-xs font-medium text-gray-700">Password Requirements:</p>
                    <ul className="space-y-1">
                      {[
                        { label: 'At least 8 characters', valid: newPassword.length >= 8 },
                        { label: 'Uppercase letter', valid: /[A-Z]/.test(newPassword) },
                        { label: 'Lowercase letter', valid: /[a-z]/.test(newPassword) },
                        { label: 'Number', valid: /[0-9]/.test(newPassword) },
                        { label: 'Special character', valid: /[^A-Za-z0-9]/.test(newPassword) },
                      ].map((req, i) => (
                        <li key={i} className="flex items-center gap-2 text-[11px]">
                           <div className={`w-3 h-3 rounded-full flex items-center justify-center ${req.valid ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                             {req.valid && <CheckCircle2 size={8} />}
                           </div>
                           <span className={req.valid ? 'text-green-700' : 'text-gray-500'}>{req.label}</span>
                        </li>
                      ))}
                    </ul>
                 </div>
               </div>

               {error && <div className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12}/> {error}</div>}

               <Button 
                 type="submit" 
                 className="w-full bg-[#0F3A5F]" 
                 disabled={loading || passwordStrength(newPassword) === 'Weak' || newPassword !== confirmPassword}
               >
                 {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Reset Password'}
               </Button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-4">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                  <ShieldCheck size={32} />
               </div>
               <h3 className="text-xl font-bold text-gray-800">Password Reset Successfully!</h3>
               <p className="text-sm text-gray-500">
                 Your password has been updated. You can now login with your new credentials.
               </p>
               <p className="text-xs text-gray-400">Redirecting to login in 3 seconds...</p>
               <Link to="/crm/login">
                 <Button className="w-full mt-4 bg-[#0F3A5F]">Go to Login</Button>
               </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
