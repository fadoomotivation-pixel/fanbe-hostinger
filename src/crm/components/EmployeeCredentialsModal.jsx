
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Copy, Download, Mail, CheckCircle, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { sendEmail } from '@/lib/emailService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EmployeeCredentialsModal = ({ isOpen, onClose, employee, credentials }) => {
  const { toast } = useToast();
  const cardRef = useRef(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  if (!employee || !credentials) return null;

  const loginUrl = window.location.origin + '/crm/login';

  const handleCopy = () => {
    const text = `Fanbe CRM Credentials\nUsername: ${employee.username}\nPassword: ${credentials.password}\nLogin: ${loginUrl}`;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Credentials copied to clipboard." });
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      
      const link = document.createElement('a');
      link.download = `Credentials_${employee.username}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast({ title: "Downloaded", description: "Credential card saved as PNG." });
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to generate image.", variant: "destructive" });
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      await sendEmail({
        recipientEmail: employee.email,
        subject: "Your Fanbe Developer CRM Login Credentials",
        templateName: "employeeCredentials",
        templateParams: {
          name: employee.name,
          username: employee.username,
          password: credentials.password
        }
      });
      toast({ title: "Sent!", description: `Credentials sent to ${employee.email}` });
      setShowEmailForm(false);
    } catch (err) {
      toast({ title: "Error", description: "Failed to send email.", variant: "destructive" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) onClose(); }}>
      <DialogContent className="max-w-md">
        {!showEmailForm ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-2">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <DialogTitle className="text-center">Employee Created Successfully!</DialogTitle>
              <DialogDescription className="text-center">
                Share these login credentials with the employee.
              </DialogDescription>
            </DialogHeader>

            {/* Credential Card Area - Capturable */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200" ref={cardRef}>
               <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-[#0F3A5F]">Fanbe Developer</h3>
                  <p className="text-xs text-gray-500">Employee Access Card</p>
               </div>
               
               <div className="space-y-3 bg-white p-4 rounded border border-gray-100 shadow-sm">
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block">Username</span>
                    <span className="font-mono font-bold text-lg select-all">{employee.username}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block">Password</span>
                    <span className="font-mono font-bold text-lg select-all text-blue-600">{credentials.password}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider block">Login URL</span>
                    <span className="text-xs text-blue-500 underline break-all">{loginUrl}</span>
                  </div>
               </div>

               <div className="mt-4 flex flex-col items-center justify-center">
                  <div className="bg-white p-2 rounded shadow-sm border">
                    <QRCodeCanvas value={loginUrl} size={100} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Scan to Login</p>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" onClick={handleCopy}>
                  <Copy size={16} className="mr-2" /> Copy
                </Button>
                <Button variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" onClick={handleDownload}>
                  <Download size={16} className="mr-2" /> Save Image
                </Button>
            </div>
            
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowEmailForm(true)}>
               <Mail size={16} className="mr-2" /> Send via Email
            </Button>
            
            <DialogFooter className="sm:justify-center">
              <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-900">Done</Button>
            </DialogFooter>
          </>
        ) : (
          /* Email Sending Form */
          <div className="space-y-4">
             <DialogHeader>
               <DialogTitle>Send Credentials</DialogTitle>
             </DialogHeader>
             <div className="space-y-3 py-2">
                <div className="space-y-1">
                   <Label>To</Label>
                   <Input value={employee.email} disabled />
                </div>
                <div className="space-y-1">
                   <Label>Subject</Label>
                   <Input value="Your Fanbe Developer CRM Login Credentials" disabled />
                </div>
                <div className="p-3 bg-gray-50 rounded border text-sm text-gray-600">
                   <p>Will include:</p>
                   <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                      <li>Username: <strong>{employee.username}</strong></li>
                      <li>Password: <strong>{credentials.password}</strong></li>
                      <li>Login Instructions</li>
                   </ul>
                </div>
             </div>
             <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowEmailForm(false)} disabled={isSendingEmail}>Cancel</Button>
                <Button onClick={handleSendEmail} disabled={isSendingEmail}>
                    {isSendingEmail ? 'Sending...' : 'Send Email'}
                </Button>
             </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeCredentialsModal;
