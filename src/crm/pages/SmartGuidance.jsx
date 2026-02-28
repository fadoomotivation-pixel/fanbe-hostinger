import React, { useState, useMemo } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Phone, MessageCircle, AlertCircle, Clock, Calendar,
  FileText, ArrowRight, TrendingUp, Bell, Zap, RefreshCw,
} from 'lucide-react';
import { format, parseISO, differenceInDays, differenceInHours } from 'date-fns';
import FollowUpBadge from '@/crm/components/FollowUpBadge';

// ── Priority scoring engine ──────────────────────────────────────
const scoreLead = (lead, calls) => {
  let score = 0;
  const reasons = [];
  const now = new Date();

  // 1) Follow-up reminders (highest weight)
  if (lead.follow_up_date) {
    const fDate = new Date(lead.follow_up_date);
    fDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = differenceInDays(fDate, today);

    if (diff < 0) {
      score += 100 + Math.min(Math.abs(diff) * 5, 50); // overdue gets highest score
      reasons.push({ type: 'overdue', text: `Follow-up overdue by ${Math.abs(diff)} day${Math.abs(diff) > 1 ? 's' : ''}`, priority: 'critical' });
    } else if (diff === 0) {
      score += 90;
      const timeText = lead.follow_up_time ? ` at ${lead.follow_up_time}` : '';
      reasons.push({ type: 'today', text: `Follow-up scheduled today${timeText}`, priority: 'high' });
    } else if (diff === 1) {
      score += 60;
      reasons.push({ type: 'tomorrow', text: 'Follow-up scheduled tomorrow', priority: 'medium' });
    }
  }

  // 2) Lead stage analysis — recently changed or hot leads
  if ((lead.interestLevel || '').toLowerCase() === 'hot') {
    score += 40;
    reasons.push({ type: 'hot', text: 'Hot lead — high conversion potential', priority: 'high' });
  } else if ((lead.interestLevel || '').toLowerCase() === 'warm') {
    score += 20;
    reasons.push({ type: 'warm', text: 'Warm lead — nurture before it cools down', priority: 'medium' });
  }

  if (lead.status === 'FollowUp') {
    score += 15;
    if (!reasons.find(r => r.type === 'overdue' || r.type === 'today')) {
      reasons.push({ type: 'stage', text: 'In FollowUp stage — needs attention', priority: 'medium' });
    }
  }

  // 3) Note-based signals
  if (lead.notes) {
    const notesLower = lead.notes.toLowerCase();
    if (notesLower.includes('interested') || notesLower.includes('ready to visit') || notesLower.includes('wants to book')) {
      score += 35;
      reasons.push({ type: 'note', text: 'Notes indicate strong interest', priority: 'high' });
    } else if (notesLower.includes('call back') || notesLower.includes('callback') || notesLower.includes('asked to call')) {
      score += 30;
      reasons.push({ type: 'note', text: 'Lead requested a callback', priority: 'high' });
    } else if (notesLower.includes('site visit') || notesLower.includes('wants to see')) {
      score += 25;
      reasons.push({ type: 'note', text: 'Site visit interest noted', priority: 'medium' });
    } else if (notesLower.includes('busy') || notesLower.includes('not reachable')) {
      score += 10;
      reasons.push({ type: 'note', text: 'Previously busy — retry now', priority: 'low' });
    }
  }

  // 4) No recent contact — stale leads need attention
  if (lead.lastActivity || lead.last_activity) {
    const lastTouch = new Date(lead.lastActivity || lead.last_activity);
    const hoursSince = differenceInHours(now, lastTouch);
    if (hoursSince > 72) {
      score += 25;
      const daysSince = Math.floor(hoursSince / 24);
      reasons.push({ type: 'stale', text: `No contact in ${daysSince} days — re-engage`, priority: 'medium' });
    }
  } else if (!lead.notes) {
    score += 20;
    reasons.push({ type: 'fresh', text: 'New lead — make first contact', priority: 'medium' });
  }

  // 5) Call history — failed calls need retry
  const leadCalls = calls.filter(c => c.leadId === lead.id);
  if (leadCalls.length > 0) {
    const lastCall = leadCalls[0];
    if (lastCall.status === 'Not Connected' || lastCall.status === 'Busy' || lastCall.status === 'not_answered' || lastCall.status === 'busy') {
      score += 15;
      reasons.push({ type: 'retry', text: `Last call: ${lastCall.status} — try again`, priority: 'medium' });
    }
  }

  return { ...lead, score, reasons };
};

// ── Main Component ────────────────────────────────────────────────
const SmartGuidance = () => {
  const { user } = useAuth();
  const { leads, calls } = useCRMData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

  const myLeads = leads.filter(l => l.assignedTo === user?.id || l.assigned_to === user?.id);
  const myCalls = calls.filter(c => c.employeeId === user?.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Score and rank all leads
  const scoredLeads = useMemo(() => {
    return myLeads
      .filter(l => l.status !== 'Booked' && l.status !== 'Lost')
      .map(lead => scoreLead(lead, myCalls))
      .sort((a, b) => b.score - a.score);
  }, [myLeads, myCalls]);

  // Filter by tab
  const filteredLeads = useMemo(() => {
    switch (activeTab) {
      case 'overdue':
        return scoredLeads.filter(l => l.reasons.some(r => r.type === 'overdue'));
      case 'today':
        return scoredLeads.filter(l => l.reasons.some(r => r.type === 'today'));
      case 'notes':
        return scoredLeads.filter(l => l.reasons.some(r => r.type === 'note'));
      case 'stale':
        return scoredLeads.filter(l => l.reasons.some(r => r.type === 'stale' || r.type === 'fresh'));
      default:
        return scoredLeads;
    }
  }, [scoredLeads, activeTab]);

  // Summary counts
  const summary = useMemo(() => ({
    total: scoredLeads.length,
    overdue: scoredLeads.filter(l => l.reasons.some(r => r.type === 'overdue')).length,
    today: scoredLeads.filter(l => l.reasons.some(r => r.type === 'today')).length,
    noteSignals: scoredLeads.filter(l => l.reasons.some(r => r.type === 'note')).length,
    stale: scoredLeads.filter(l => l.reasons.some(r => r.type === 'stale' || r.type === 'fresh')).length,
  }), [scoredLeads]);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getReasonIcon = (type) => {
    switch (type) {
      case 'overdue': return <AlertCircle className="h-3.5 w-3.5" />;
      case 'today': return <Clock className="h-3.5 w-3.5" />;
      case 'tomorrow': return <Calendar className="h-3.5 w-3.5" />;
      case 'note': return <FileText className="h-3.5 w-3.5" />;
      case 'hot': case 'warm': return <TrendingUp className="h-3.5 w-3.5" />;
      case 'stale': case 'fresh': return <RefreshCw className="h-3.5 w-3.5" />;
      case 'retry': return <Phone className="h-3.5 w-3.5" />;
      case 'stage': return <Zap className="h-3.5 w-3.5" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Smart Guidance</h1>
        <p className="text-gray-500">AI-powered calling recommendations based on follow-ups, notes & lead activity</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-700">{summary.overdue}</p>
            <p className="text-xs text-red-500">Overdue</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-700">{summary.today}</p>
            <p className="text-xs text-yellow-600">Due Today</p>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-orange-700">{summary.noteSignals}</p>
            <p className="text-xs text-orange-500">Note Signals</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 text-center">
            <RefreshCw className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-700">{summary.stale}</p>
            <p className="text-xs text-blue-500">Need Re-engage</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All ({summary.total})</TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600">Overdue ({summary.overdue})</TabsTrigger>
          <TabsTrigger value="today" className="text-yellow-600">Today ({summary.today})</TabsTrigger>
          <TabsTrigger value="notes" className="text-orange-600">Note Signals ({summary.noteSignals})</TabsTrigger>
          <TabsTrigger value="stale" className="text-blue-600">Re-engage ({summary.stale})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16">
              <Zap className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No leads in this category</p>
              <p className="text-gray-300 text-sm mt-1">Great job staying on top of things!</p>
            </div>
          ) : (
            filteredLeads.map((lead, idx) => (
              <Card
                key={lead.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  idx < 3 ? 'border-l-4 border-l-[#D4AF37]' : ''
                }`}
                onClick={() => navigate(`/crm/sales/lead/${lead.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {idx < 3 && (
                          <span className="text-xs font-bold text-[#D4AF37] bg-yellow-50 px-2 py-0.5 rounded">
                            #{idx + 1} Priority
                          </span>
                        )}
                        <h3 className="font-semibold text-[#0F3A5F]">{lead.name}</h3>
                        <span className="text-sm text-gray-400">({lead.phone})</span>
                      </div>

                      {/* Project & status */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {lead.project && (
                          <span className="text-xs text-gray-500">{lead.project}</span>
                        )}
                        <Badge variant="outline" className="text-[10px]">{lead.status}</Badge>
                        <FollowUpBadge
                          followUpDate={lead.follow_up_date}
                          followUpTime={lead.follow_up_time}
                          size="small"
                        />
                      </div>

                      {/* Reason chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {lead.reasons.map((reason, i) => (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${getPriorityStyle(reason.priority)}`}
                          >
                            {getReasonIcon(reason.type)}
                            {reason.text}
                          </span>
                        ))}
                      </div>

                      {/* Last note preview */}
                      {lead.notes && (
                        <p className="text-xs text-gray-400 mt-2 truncate max-w-xl">
                          {lead.notes.split('\n').pop()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.phone}`; }}
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank'); }}
                      >
                        <MessageCircle className="h-4 w-4 mr-1 text-green-600" />
                        <span className="text-xs">WhatsApp</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartGuidance;
