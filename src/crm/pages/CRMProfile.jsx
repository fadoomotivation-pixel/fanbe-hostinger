
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
import { updateUserPassword, verifyPassword, getAllUsers } from '@/lib/authUtils';

const CRMProfile = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('Weak');

  const checkStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score <= 2) setPasswordStrength('Weak');
    else if (score === 3) setPasswordStrength('Fair');
    else if (score === 4) setPasswordStrength('Good');
    else setPasswordStrength('Strong');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    // In real app, re-verify current password hash. 
    // Here we need to find user's stored hash from localStorage to compare
    const allUsers = getAllUsers();
    const currentUserRecord = allUsers.find(u => u.id === user.id);
    
    if (!verifyPassword(formData.currentPassword, currentUserRecord.password)) {
       toast({ title: "Error", description: "Incorrect current password", variant: "destructive" });
       return;
    }

    if (passwordStrength === 'Weak') {
       toast({ title: "Error", description: "Password is too weak. Must contain uppercase, number, and special char.", variant: "destructive" });
       return;
    }

    updateUserPassword(user.id, formData.newPassword);
    toast({ title: 'Success', description: 'Password changed successfully! Please login again.' });
    setTimeout(logout, 2000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'newPassword') checkStrength(value);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="w-24 h-24 bg-[#0F3A5F] text-white text-3xl font-bold flex items-center justify-center rounded-full mx-auto mb-4">
              {user.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{user.role.replace('_', ' ').toUpperCase()}</p>
            
            <div className="text-left space-y-3 mt-6 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Employee ID</span>
                <span className="font-medium">{user.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Status</span>
                <span className="text-green-600 font-bold flex items-center gap-1"><ShieldCheck size={14}/> Active</span>
              </div>
              <div className="flex justify-between pb-2">
                 <span className="text-gray-500">Last Login</span>
                 <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change Form */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password</label>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">
                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input 
                   type={showPassword ? "text" : "password"} 
                   name="newPassword"
                   value={formData.newPassword}
                   onChange={handleChange}
                   required
                   minLength={8}
                />
                {formData.newPassword && (
                   <div className="flex gap-2 items-center text-xs mt-1">
                      <span>Strength:</span>
                      <span className={`font-bold ${
                         passwordStrength === 'Weak' ? 'text-red-500' :
                         passwordStrength === 'Fair' ? 'text-orange-500' :
                         passwordStrength === 'Good' ? 'text-blue-500' : 'text-green-500'
                      }`}>{passwordStrength}</span>
                   </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input 
                   type={showPassword ? "text" : "password"} 
                   name="confirmPassword"
                   value={formData.confirmPassword}
                   onChange={handleChange}
                   required
                />
              </div>

              <Button type="submit" className="w-full bg-[#0F3A5F]">Update Password</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMProfile;
