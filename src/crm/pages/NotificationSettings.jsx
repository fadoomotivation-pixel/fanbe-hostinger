
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getNotificationSettings, saveNotificationSettings, getEmailLogs, sendEmail } from '@/lib/emailService';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const NotificationSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState(getNotificationSettings());
  const [logs, setLogs] = useState([]);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    setLogs(getEmailLogs());
  }, []);

  const handleToggle = (key) => {
    const newSettings = {
      ...settings,
      triggers: {
        ...settings.triggers,
        [key]: !settings.triggers[key]
      }
    };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
    toast({ title: 'Settings Saved' });
  };

  const sendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      await sendEmail({
        recipientEmail: 'current.user@example.com',
        subject: 'Test Notification',
        templateName: 'test',
        templateParams: { message: 'This is a test.' }
      });
      toast({ title: 'Test Email Sent' });
      setLogs(getEmailLogs());
    } catch (e) {
      toast({ title: 'Failed to send', variant: 'destructive' });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Notification Settings</h1>
        <Button onClick={sendTestEmail} disabled={isSendingTest} className="bg-[#0F3A5F]">
          {isSendingTest ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <Mail className="mr-2 h-4 w-4" />}
          Send Test Email
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="font-bold text-lg mb-4 text-[#0F3A5F]">Email Triggers</h2>
          <div className="space-y-4">
            {Object.keys(settings.triggers).map(key => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="capitalize text-gray-700">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div 
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${settings.triggers[key] ? 'bg-green-500' : 'bg-gray-300'}`}
                  onClick={() => handleToggle(key)}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${settings.triggers[key] ? 'translate-x-6' : 'translate-x-0'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logs Panel */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="font-bold text-lg mb-4 text-[#0F3A5F]">Recent Email Logs</h2>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {logs.length === 0 && <p className="text-gray-400 text-sm">No emails sent yet.</p>}
            {logs.map(log => (
              <div key={log.id} className="text-sm p-3 border rounded hover:bg-gray-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-700">{log.template}</span>
                  <span className={`flex items-center text-xs ${log.status === 'Sent' ? 'text-green-600' : 'text-red-600'}`}>
                    {log.status === 'Sent' ? <CheckCircle size={12} className="mr-1"/> : <XCircle size={12} className="mr-1"/>}
                    {log.status}
                  </span>
                </div>
                <div className="text-gray-500 text-xs flex justify-between">
                  <span>To: {log.recipient}</span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
