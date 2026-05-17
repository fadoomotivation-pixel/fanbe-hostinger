
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Download, ShieldAlert, History } from 'lucide-react';

const SecuritySettings = () => {
  const { toast } = useToast();

  // Mock Data
  const loginHistory = [
    { id: 1, user: 'Admin', ip: '192.168.1.1', device: 'Chrome / Windows', time: '2023-10-26 10:00 AM', status: 'Success', location: 'Delhi, IN' },
    { id: 2, user: 'John Doe', ip: '192.168.1.5', device: 'Safari / iPhone', time: '2023-10-26 09:45 AM', status: 'Failed', location: 'Mumbai, IN' },
  ];

  const activeSessions = [
    { id: 1, user: 'Admin', ip: '192.168.1.1', device: 'Chrome / Windows', loginTime: '10:00 AM', lastActive: 'Just now' },
    { id: 2, user: 'Jane Smith', ip: '10.0.0.5', device: 'Firefox / Mac', loginTime: '08:30 AM', lastActive: '5 min ago' },
  ];

  const handleLogoutSession = (id) => {
    toast({ title: "Session Terminated", description: "User has been logged out." });
  };

  const handleSavePolicy = () => {
    toast({ title: "Policy Saved", description: "Security settings updated successfully." });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 p-4">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Security Settings</h1>

      {/* Section 1: Login History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Login History</CardTitle>
            <CardDescription>Recent login activity monitoring.</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead className="hidden md:table-cell">Device</TableHead>
                  <TableHead className="hidden lg:table-cell">IP & Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginHistory.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell className="text-xs text-gray-500">{log.time}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{log.device}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      <div>{log.ip}</div>
                      <div className="text-gray-400">{log.location}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${log.status === 'Success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage currently active user sessions.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="space-y-4">
             {activeSessions.map(session => (
               <div key={session.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-3 border rounded bg-gray-50">
                 <div>
                   <p className="font-bold">{session.user}</p>
                   <p className="text-xs text-gray-500">{session.device} • {session.ip}</p>
                   <p className="text-xs text-blue-600">Active: {session.lastActive}</p>
                 </div>
                 <Button variant="destructive" size="sm" onClick={() => handleLogoutSession(session.id)} className="mt-2 md:mt-0">
                   Logout
                 </Button>
               </div>
             ))}
             <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50">Logout All Sessions</Button>
           </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Section 3: Password Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Password Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                 <Label>Minimum Length: 8 chars</Label>
                 <Slider defaultValue={[8]} max={16} min={6} step={1} />
              </div>
              <div className="flex items-center justify-between">
                 <Label>Require Uppercase</Label>
                 <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                 <Label>Require Numbers</Label>
                 <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Password Expiry</Label>
                <Select defaultValue="90">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                    <SelectItem value="60">60 Days</SelectItem>
                    <SelectItem value="90">90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSavePolicy} className="w-full">Save Policy</Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Lockout Policy */}
        <Card>
           <CardHeader>
             <CardTitle>Lockout & Timeout</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6">
              <div className="space-y-2">
                 <Label>Max Failed Attempts: 5</Label>
                 <Slider defaultValue={[5]} max={10} min={3} step={1} />
              </div>
              <div className="space-y-2">
                <Label>Lockout Duration</Label>
                <Select defaultValue="15">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 Minutes</SelectItem>
                    <SelectItem value="30">30 Minutes</SelectItem>
                    <SelectItem value="60">1 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                 <Label>Session Timeout: 30 min</Label>
                 <Slider defaultValue={[30]} max={60} min={5} step={5} />
              </div>
              <Button onClick={handleSavePolicy} className="w-full">Save Settings</Button>
           </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecuritySettings;
