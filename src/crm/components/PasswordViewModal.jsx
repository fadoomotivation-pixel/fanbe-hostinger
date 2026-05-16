
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { decryptPassword } from '@/lib/authUtils';
import { Copy, AlertTriangle, Eye, EyeOff } from 'lucide-react';

const PasswordViewModal = ({ isOpen, onClose, userToView }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  if (!userToView) return null;

  const decryptedPassword = decryptPassword(userToView.password);

  const handleCopy = () => {
    navigator.clipboard.writeText(decryptedPassword);
    toast({ title: "Success", description: "Password copied to clipboard!" });
    
    // Log the action
    const logs = JSON.parse(localStorage.getItem('crm_security_logs') || '[]');
    logs.push({
      action: 'PASSWORD_COPIED',
      admin: user.username,
      targetUser: userToView.username,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('crm_security_logs', JSON.stringify(logs));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            Confidential Information
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-red-50 p-3 rounded-md border border-red-100 text-sm text-red-800">
            Passwords are sensitive information. Ensure you are in a secure environment before viewing.
            This action is logged.
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Username / ID</label>
            <Input value={userToView.username} readOnly className="bg-gray-50" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Email</label>
            <Input value={userToView.email} readOnly className="bg-gray-50" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Password</label>
            <div className="relative">
              <Input 
                type={showPassword ? "text" : "password"} 
                value={decryptedPassword} 
                readOnly 
                className="pr-20 font-mono" 
              />
              <div className="absolute right-1 top-1 flex gap-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleCopy}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordViewModal;
