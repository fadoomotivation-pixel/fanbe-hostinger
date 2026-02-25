import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Key, Copy, Download, Mail, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { sendEmail } from '@/lib/emailService';
import { supabaseAdmin } from '@/lib/supabase';

const ResetPasswordModal = ({ isOpen, onClose, employee, onResetSuccess }) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1); // 1: Input, 2: Success
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPass, setGeneratedPass] = useState('');
  const [strength, setStrength] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const cardRef = React.useRef(null);

  if (!employee) return null;

  const calculateStrength = (pass) => {
      if (pass.length < 6) return 'Weak';
      if (pass.length < 10) return 'Medium';
      if (/[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) return 'Strong';
      return 'Medium';
  };

  const handlePasswordChange = (e) => {
      const val = e.target.value;
      setNewPassword(val);
      setStrength(calculateStrength(val));
  };

  const generateRandomPassword = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      let pass = "";
      for (let i = 0; i < 12; i++) {
          pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setNewPassword(pass);
      setConfirmPassword(pass);
      setStrength(calculateStrength(pass));
      toast({ title: "Generated", description: "Random password generated." });
  };

  const handleReset = async () => {
      if (!newPassword || newPassword !== confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match or are empty.", variant: "destructive" });
          return;
      }
      
      if (newPassword.length < 6) {
          toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
          return;
      }

      setIsResetting(true);
      
      try {
          console.log('[ResetPassword] Updating password for user:', employee.id);
          
          // Use Supabase Admin API to update user password
          const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
              employee.id,
              { password: newPassword }
          );

          if (error) {
              console.error('[ResetPassword] Supabase error:', error);
              toast({ 
                  title: "Error", 
                  description: error.message || "Failed to reset password.", 
                  variant: "destructive" 
              });
              return;
          }

          console.log('[ResetPassword] Password updated successfully');
          
          // Call parent handler to refresh employee list
          if (onResetSuccess) {
              await onResetSuccess();
          }
          
          setGeneratedPass(newPassword);
          setStep(2);
          toast({ title: "Success", description: "Password reset successfully in Supabase." });
      } catch (err) {
          console.error('[ResetPassword] Unexpected error:', err);
          toast({ 
              title: "Error", 
              description: "An unexpected error occurred.", 
              variant: "destructive" 
          });
      } finally {
          setIsResetting(false);
      }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(`Username: ${employee.username}\nPassword: ${generatedPass}`);
      toast({ title: "Copied!", description: "Credentials copied to clipboard." });
  };

  const handleDownload = async () => {
      if (!cardRef.current) return;
      try {
        const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: "#ffffff" });
        const link = document.createElement('a');
        link.download = `PasswordReset_${employee.username}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        toast({ title: "Downloaded", description: "Saved as PNG." });
      } catch (err) {
        console.error(err);
      }
  };

  const handleSendEmail = async () => {
      try {
          await sendEmail({
              recipientEmail: employee.email,
              subject: "Your Password Has Been Reset - Fanbe CRM",
              templateName: "employeeCredentials", // Reuse existing template logic
              templateParams: {
                  name: employee.name,
                  username: employee.username,
                  password: generatedPass
              }
          });
          toast({ title: "Email Sent", description: `New credentials sent to ${employee.email}` });
      } catch (err) {
          toast({ title: "Error", description: "Failed to send email.", variant: "destructive" });
      }
  };

  const resetState = () => {
      setStep(1);
      setNewPassword('');
      setConfirmPassword('');
      setGeneratedPass('');
      setStrength('');
      setShowPassword(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) resetState(); onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <Key className="w-5 h-5 text-blue-600" /> 
             {step === 1 ? `Reset Password for ${employee.name}` : 'Password Reset Successful'}
          </DialogTitle>
          <DialogDescription>
             {step === 1 ? "Create a new password for this employee." : "Share the new credentials with the employee."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                        <Input 
                            type={showPassword ? "text" : "password"} 
                            value={newPassword}
                            onChange={handlePasswordChange}
                            className="pr-10"
                            placeholder="Minimum 6 characters"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                         <span className={`font-medium ${strength === 'Strong' ? 'text-green-600' : strength === 'Medium' ? 'text-yellow-600' : 'text-red-500'}`}>
                             Strength: {strength || 'None'}
                         </span>
                         <button onClick={generateRandomPassword} className="text-blue-600 hover:underline">Generate Random</button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Confirm Password</Label>
                    <Input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                    />
                </div>
            </div>
        ) : (
            <div className="py-4 space-y-4">
                <div ref={cardRef} className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="text-green-600" size={24} />
                    </div>
                    <h3 className="font-bold text-gray-900">New Credentials</h3>
                    <div className="text-sm text-gray-500">
                        <p>Username: <span className="font-mono font-bold text-gray-800">{employee.username}</span></p>
                        <p>Password: <span className="font-mono font-bold text-blue-600 text-lg">{generatedPass}</span></p>
                    </div>
                    <p className="text-xs text-gray-400">Login URL: fanbegroup.com/crm/login</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}><Copy className="w-4 h-4 mr-1" /> Copy</Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}><Download className="w-4 h-4 mr-1" /> Save</Button>
                    <Button variant="outline" size="sm" onClick={handleSendEmail}><Mail className="w-4 h-4 mr-1" /> Email</Button>
                </div>
            </div>
        )}

        <DialogFooter>
            {step === 1 ? (
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isResetting}>Cancel</Button>
                    <Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isResetting}>
                        {isResetting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
                        ) : (
                            'Reset Password'
                        )}
                    </Button>
                </>
            ) : (
                <Button onClick={() => { resetState(); onClose(); }} className="w-full">Done</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordModal;
