import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Eye, EyeOff, Save, ShieldCheck, Check, X } from 'lucide-react';

const SuperAdminSettings = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // Section 2 State
  const [newUsername, setNewUsername] = useState('');
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState(false);
  
  // Section 3 State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Helper: Username Validation
  const isValidUsername = (username) => /^[a-zA-Z0-9_]{4,20}$/.test(username);
  const isUsernameAvailable = (username) => {
    // In a real app, check API. Here, mock check.
    return username !== 'admin'; 
  };

  // Helper: Password Strength
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    if (score < 2) return { label: 'Weak', color: 'text-red-500', width: '20%' };
    if (score < 4) return { label: 'Fair', color: 'text-yellow-500', width: '50%' };
    if (score < 5) return { label: 'Good', color: 'text-blue-500', width: '80%' };
    return { label: 'Strong', color: 'text-green-500', width: '100%' };
  };
  const strength = getPasswordStrength(newPassword);

  const handleUpdateUsername = () => {
    if (!isValidUsername(newUsername)) return;
    setIsUsernameModalOpen(false);
    toast({ title: "Success", description: `Username updated to ${newUsername} successfully!` });
    setNewUsername('');
  };

  const handleUpdatePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsPasswordModalOpen(false);
    toast({ title: "Success", description: "Password updated! Redirecting to login..." });
    setTimeout(() => {
      logout();
    }, 5000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 p-4">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">My Account Settings</h1>

      {/* Section 1: Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-500">Name</Label>
              <p className="font-medium text-lg">{user?.name}</p>
            </div>
            <div>
              <Label className="text-gray-500">Email</Label>
              <p className="font-medium text-lg">{user?.email}</p>
            </div>
            <div>
              <Label className="text-gray-500">Employee ID</Label>
              <p className="font-medium text-lg">{user?.id}</p>
            </div>
            <div>
              <Label className="text-gray-500">Role</Label>
              <p className="font-medium text-lg uppercase">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Change Username */}
      <Card>
        <CardHeader>
          <CardTitle>Change Username</CardTitle>
          <CardDescription>Update your login username. Must be unique.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Username</Label>
            <Input value={user?.id} disabled className="bg-gray-100" />
          </div>
          <div className="space-y-2">
            <Label>New Username</Label>
            <Input 
              value={newUsername} 
              onChange={(e) => setNewUsername(e.target.value)} 
              placeholder="Enter new username"
              className={newUsername && !isValidUsername(newUsername) ? 'border-red-300' : ''}
            />
            {newUsername && (
              <p className={`text-sm ${isValidUsername(newUsername) ? 'text-green-600' : 'text-red-500'}`}>
                {isValidUsername(newUsername) ? "Username format valid" : "4-20 chars, alphanumeric + underscore only"}
              </p>
            )}
          </div>
          
          <Dialog open={isUsernameModalOpen} onOpenChange={setIsUsernameModalOpen}>
            <DialogTrigger asChild>
              <Button disabled={!isValidUsername(newUsername)} className="w-full md:w-auto">Update Username</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Username Change</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to change your username to <strong>{newUsername}</strong>?</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUsernameModalOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateUsername}>Confirm Update</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Section 3: Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Ensure your account is secure with a strong password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 relative">
            <Label>Current Password</Label>
            <div className="relative">
              <Input 
                type={showCurrentPass ? "text" : "password"} 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input 
                type={showNewPass ? "text" : "password"} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && (
               <div className="space-y-1">
                 <div className="h-1 w-full bg-gray-200 rounded overflow-hidden">
                   <div className={`h-full transition-all duration-300 ${strength.color.replace('text', 'bg')}`} style={{ width: strength.width }}></div>
                 </div>
                 <p className={`text-xs ${strength.color}`}>Strength: {strength.label}</p>
               </div>
            )}
            <ul className="text-xs text-gray-500 space-y-1 mt-2">
              <li className="flex items-center">{newPassword.length >= 8 ? <Check size={12} className="text-green-500 mr-1"/> : <span className="w-4"/>} 8+ Characters</li>
              <li className="flex items-center">{/[A-Z]/.test(newPassword) ? <Check size={12} className="text-green-500 mr-1"/> : <span className="w-4"/>} Uppercase Letter</li>
              <li className="flex items-center">{/[a-z]/.test(newPassword) ? <Check size={12} className="text-green-500 mr-1"/> : <span className="w-4"/>} Lowercase Letter</li>
              <li className="flex items-center">{/[0-9]/.test(newPassword) ? <Check size={12} className="text-green-500 mr-1"/> : <span className="w-4"/>} Number</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Input 
                type={showConfirmPass ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
            <DialogTrigger asChild>
              <Button disabled={!currentPassword || !newPassword || strength.label === 'Weak'} className="w-full md:w-auto">Update Password</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Password Update</DialogTitle>
              </DialogHeader>
              <p>You will be logged out automatically after updating your password.</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdatePassword} variant="destructive">Update & Logout</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminSettings;