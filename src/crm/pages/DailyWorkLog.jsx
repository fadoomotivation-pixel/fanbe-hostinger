
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Calendar as CalendarIcon, Save, Edit2, TrendingUp, PhoneCall, CheckCircle, Users } from 'lucide-react';
import { format } from 'date-fns';

const DailyWorkLog = () => {
  const { user } = useAuth();
  const { workLogs, saveDailyWorkLog } = useCRMData();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing] = useState(true);

  const [formData, setFormData] = useState({
    totalCalls: '',
    connectedCalls: '',
    siteVisits: '',
    majorObjection: '',
    token: '',
    customObjection: ''
  });

  // Load existing log for selected date
  useEffect(() => {
    const existingLog = workLogs.find(l => l.employeeId === user.id && l.date === selectedDate);
    if (existingLog) {
      setFormData({
        totalCalls: existingLog.totalCalls,
        connectedCalls: existingLog.connectedCalls,
        siteVisits: existingLog.siteVisits,
        majorObjection: ['Budget', 'Not Interested', 'Competitor', 'No Response'].includes(existingLog.majorObjection) 
          ? existingLog.majorObjection 
          : 'Other',
        token: existingLog.token,
        customObjection: ['Budget', 'Not Interested', 'Competitor', 'No Response'].includes(existingLog.majorObjection) 
          ? '' 
          : existingLog.majorObjection
      });
      setIsEditing(false);
    } else {
      setFormData({
        totalCalls: '',
        connectedCalls: '',
        siteVisits: '',
        majorObjection: '',
        token: '',
        customObjection: ''
      });
      setIsEditing(true);
    }
  }, [selectedDate, workLogs, user.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.totalCalls) {
      toast({ title: "Error", description: "Total calls is required", variant: "destructive" });
      return;
    }

    const objection = formData.majorObjection === 'Other' ? formData.customObjection : formData.majorObjection;

    const logData = {
      employeeId: user.id,
      date: selectedDate,
      totalCalls: Number(formData.totalCalls),
      connectedCalls: Number(formData.connectedCalls),
      siteVisits: Number(formData.siteVisits),
      majorObjection: objection,
      token: Number(formData.token)
    };

    saveDailyWorkLog(logData);
    setIsEditing(false);
    toast({ title: "Success", description: `Daily work log saved for ${selectedDate}` });
  };

  const getRecentLogs = () => {
    return workLogs
      .filter(l => l.employeeId === user.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7);
  };

  const conversionRate = formData.totalCalls > 0 
    ? Math.round((formData.connectedCalls / formData.totalCalls) * 100) 
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Daily Work Log</h1>
          <p className="text-gray-500 text-sm">Track your daily performance metrics</p>
        </div>
        <div className="w-full md:w-auto">
          <Input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full md:w-48 bg-white border-gray-300"
          />
        </div>
      </div>

      {/* Summary Card (Read Mode) */}
      {!isEditing ? (
        <Card className="bg-gradient-to-br from-[#0F3A5F] to-[#1a4d7a] text-white border-none shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium opacity-90">Summary for {format(new Date(selectedDate), 'MMM dd, yyyy')}</CardTitle>
            <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)} className="h-8 bg-white/20 hover:bg-white/30 text-white border-0">
              <Edit2 size={14} className="mr-2" /> Edit Log
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1 text-blue-200 text-sm"><PhoneCall size={14} /> Total Calls</div>
              <div className="text-2xl font-bold">{formData.totalCalls}</div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1 text-green-200 text-sm"><CheckCircle size={14} /> Connected</div>
              <div className="text-2xl font-bold">{formData.connectedCalls}</div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1 text-yellow-200 text-sm"><Users size={14} /> Site Visits</div>
              <div className="text-2xl font-bold">{formData.siteVisits}</div>
            </div>
            <div className="p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1 text-purple-200 text-sm"><TrendingUp size={14} /> Conversion</div>
              <div className="text-2xl font-bold">{conversionRate}%</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Edit Form */
        <Card>
          <CardHeader>
             <CardTitle className="text-lg">Log Activity for {format(new Date(selectedDate), 'MMM dd, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Total Calls Done <span className="text-red-500">*</span></Label>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={formData.totalCalls}
                    onChange={(e) => setFormData({...formData, totalCalls: e.target.value})}
                    className="h-12 text-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Connected Calls</Label>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={formData.connectedCalls}
                    onChange={(e) => setFormData({...formData, connectedCalls: e.target.value})}
                    className="h-12 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Site Visits Fixed</Label>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={formData.siteVisits}
                    onChange={(e) => setFormData({...formData, siteVisits: e.target.value})}
                    className="h-12 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Token Received</Label>
                  <Input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    value={formData.token}
                    onChange={(e) => setFormData({...formData, token: e.target.value})}
                    className="h-12 text-lg"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Major Objection</Label>
                  <Select 
                    value={formData.majorObjection} 
                    onValueChange={(val) => setFormData({...formData, majorObjection: val})}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select primary objection faced today" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Budget">Budget Issue</SelectItem>
                      <SelectItem value="Not Interested">Not Interested</SelectItem>
                      <SelectItem value="Competitor">Competitor Pricing</SelectItem>
                      <SelectItem value="No Response">No Response / Not Picking</SelectItem>
                      <SelectItem value="Other">Other (Specify)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.majorObjection === 'Other' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>Specify Objection</Label>
                    <Input 
                      placeholder="Type details..."
                      value={formData.customObjection}
                      onChange={(e) => setFormData({...formData, customObjection: e.target.value})}
                      className="h-12"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700">
                  <Save className="mr-2 h-5 w-5" /> Save Daily Log
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-semibold text-gray-700">Recent History (Last 7 Days)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getRecentLogs().map(log => (
            <Card key={log.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedDate(log.date); window.scrollTo(0,0); }}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-[#0F3A5F]">{format(new Date(log.date), 'MMM dd')}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${log.conversionRate >= 10 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {log.conversionRate}% Conv.
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-gray-500 text-xs">Calls</div>
                    <div className="font-semibold">{log.totalCalls}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-gray-500 text-xs">Conn.</div>
                    <div className="font-semibold">{log.connectedCalls}</div>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <div className="text-gray-500 text-xs">Visits</div>
                    <div className="font-semibold">{log.siteVisits}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {getRecentLogs().length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-400 italic">No previous logs found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyWorkLog;
