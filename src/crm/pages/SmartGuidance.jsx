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
  Target, Lightbulb, Brain, Star, Sparkles, ThumbsUp,
  Sun, Moon, CloudRain, Timer, TrendingDown, AlertTriangle
} from 'lucide-react';
import { format, parseISO, differenceInDays, differenceInHours, getHours, getDay } from 'date-fns';
import FollowUpBadge from '@/crm/components/FollowUpBadge';

// ══════════════════════════════════════════════════════════════════════════
// AI-POWERED LEAD SCORING ENGINE WITH PREDICTIVE ANALYTICS
// ══════════════════════════════════════════════════════════════════════════

// Calculate success probability based on lead patterns
const calculateSuccessProbability = (lead, calls) => {
  let probability = 50; // base probability
  const leadCalls = calls.filter(c => c.leadId === lead.id);
  
  // Interest level multiplier
  const interest = (lead.interestLevel || '').toLowerCase();
  if (interest === 'hot') probability += 25;
  else if (interest === 'warm') probability += 15;
  else if (interest === 'cold') probability -= 10;
  
  // Budget indicator
  if (lead.budget && parseInt(lead.budget) > 0) probability += 10;
  
  // Engagement score from calls
  const connectedCalls = leadCalls.filter(c => 
    c.status === 'Connected' || c.status === 'connected'
  ).length;
  if (connectedCalls > 2) probability += 15;
  else if (connectedCalls === 0) probability -= 15;
  
  // Notes sentiment analysis (basic)
  if (lead.notes) {
    const positive = ['interested', 'ready', 'wants', 'confirm', 'book', 'yes', 'definitely'];
    const negative = ['not interested', 'busy', 'maybe later', 'call later', 'no'];
    const notesLower = lead.notes.toLowerCase();
    
    positive.forEach(word => {
      if (notesLower.includes(word)) probability += 5;
    });
    negative.forEach(word => {
      if (notesLower.includes(word)) probability -= 5;
    });
  }
  
  // Response rate
  if (leadCalls.length > 0) {
    const responseRate = (connectedCalls / leadCalls.length) * 100;
    if (responseRate > 70) probability += 10;
    else if (responseRate < 30) probability -= 10;
  }
  
  return Math.max(0, Math.min(100, probability));
};

// Predict best time to call based on past call history
const predictBestTimeToCall = (lead, calls) => {
  const leadCalls = calls.filter(c => c.leadId === lead.id && c.status === 'Connected');
  
  if (leadCalls.length === 0) {
    // Default recommendations based on industry best practices
    const now = new Date();
    const hour = getHours(now);
    
    if (hour < 10) return { time: '10:00 AM - 12:00 PM', reason: 'Morning peak hours', icon: Sun };
    if (hour < 14) return { time: '2:00 PM - 4:00 PM', reason: 'Post-lunch window', icon: Sun };
    if (hour < 17) return { time: '5:00 PM - 7:00 PM', reason: 'Evening availability', icon: Moon };
    return { time: 'Tomorrow 10:00 AM', reason: 'Fresh start', icon: Sun };
  }
  
  // Analyze successful call patterns
  const hourCounts = {};
  leadCalls.forEach(call => {
    const hour = getHours(new Date(call.timestamp));
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const bestHour = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  const period = parseInt(bestHour) < 12 ? 'Morning' : parseInt(bestHour) < 17 ? 'Afternoon' : 'Evening';
  return { 
    time: `${bestHour}:00 - ${parseInt(bestHour) + 1}:00`, 
    reason: `${period} works best`, 
    icon: parseInt(bestHour) < 12 ? Sun : parseInt(bestHour) < 17 ? Sun : Moon 
  };
};

// Generate personalized calling script suggestions
const generateCallScript = (lead, calls) => {
  const leadCalls = calls.filter(c => c.leadId === lead.id);
  const lastCall = leadCalls[0];
  const interest = (lead.interestLevel || '').toLowerCase();
  
  // First time call
  if (leadCalls.length === 0) {
    return {
      opening: `Hi ${lead.name}, this is regarding ${lead.project}. Is this a good time?`,
      keyPoints: [
        `Ask about their property requirements`,
        `Mention budget range: ₹${lead.budget || 'Discuss budget'}`,
        `Offer site visit scheduling`
      ],
      closing: `Can I schedule a site visit for you this week?`
    };
  }
  
  // Follow-up call
  if (lastCall?.status === 'Connected') {
    return {
      opening: `Hi ${lead.name}, following up on our last conversation about ${lead.project}.`,
      keyPoints: [
        `Reference previous discussion`,
        `Address any concerns mentioned`,
        interest === 'hot' ? `Discuss booking process` : `Share new project updates`
      ],
      closing: interest === 'hot' 
        ? `Shall we proceed with the booking?`
        : `When can you visit the site?`
    };
  }
  
  // Retry after failed call
  return {
    opening: `Hi ${lead.name}, tried reaching you earlier. Hope you're doing well!`,
    keyPoints: [
      `Keep it brief and friendly`,
      `Share one key project highlight`,
      `Create urgency: Limited units available`
    ],
    closing: `Can we have a quick 5-minute discussion today?`
  };
};

// Lead quality scoring
const calculateLeadQuality = (lead, calls) => {
  let quality = 0;
  const maxQuality = 5;
  
  // Has budget
  if (lead.budget && parseInt(lead.budget) > 0) quality += 1;
  
  // High interest
  const interest = (lead.interestLevel || '').toLowerCase();
  if (interest === 'hot') quality += 1.5;
  else if (interest === 'warm') quality += 0.5;
  
  // Engagement
  const leadCalls = calls.filter(c => c.leadId === lead.id);
  const connected = leadCalls.filter(c => c.status === 'Connected').length;
  if (connected >= 2) quality += 1;
  
  // Has notes (shows engagement)
  if (lead.notes && lead.notes.length > 50) quality += 0.5;
  
  // Recent activity
  if (lead.lastActivity) {
    const daysSince = differenceInDays(new Date(), new Date(lead.lastActivity));
    if (daysSince <= 2) quality += 1;
  }
  
  return Math.min(maxQuality, quality);
};

// Enhanced scoring with AI predictions
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
      score += 100 + Math.min(Math.abs(diff) * 5, 50);
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

  // 2) AI Success Prediction
  const successProb = calculateSuccessProbability(lead, calls);
  if (successProb >= 70) {
    score += 50;
    reasons.push({ type: 'ai-high', text: `${successProb}% conversion probability`, priority: 'high' });
  } else if (successProb >= 50) {
    score += 25;
    reasons.push({ type: 'ai-medium', text: `${successProb}% conversion probability`, priority: 'medium' });
  }

  // 3) Lead quality
  const quality = calculateLeadQuality(lead, calls);
  score += quality * 10;
  if (quality >= 4) {
    reasons.push({ type: 'quality', text: `High-quality lead (${quality}/5 stars)`, priority: 'high' });
  }

  // 4) Interest level
  const interest = (lead.interestLevel || '').toLowerCase();
  if (interest === 'hot') {
    score += 40;
    reasons.push({ type: 'hot', text: 'Hot lead — strike while iron is hot!', priority: 'high' });
  } else if (interest === 'warm') {
    score += 20;
    reasons.push({ type: 'warm', text: 'Warm lead — nurture to conversion', priority: 'medium' });
  }

  // 5) Stage analysis
  if (lead.status === 'FollowUp') {
    score += 15;
    if (!reasons.find(r => r.type === 'overdue' || r.type === 'today')) {
      reasons.push({ type: 'stage', text: 'In FollowUp stage — needs attention', priority: 'medium' });
    }
  }

  // 6) Note-based signals
  if (lead.notes) {
    const notesLower = lead.notes.toLowerCase();
    if (notesLower.includes('interested') || notesLower.includes('ready to visit') || notesLower.includes('wants to book')) {
      score += 35;
      reasons.push({ type: 'note', text: '💰 Strong buying signals in notes', priority: 'high' });
    } else if (notesLower.includes('call back') || notesLower.includes('callback')) {
      score += 30;
      reasons.push({ type: 'note', text: '📞 Callback requested', priority: 'high' });
    } else if (notesLower.includes('site visit')) {
      score += 25;
      reasons.push({ type: 'note', text: '🏗️ Site visit interest noted', priority: 'medium' });
    }
  }

  // 7) Staleness check
  if (lead.lastActivity || lead.last_activity) {
    const lastTouch = new Date(lead.lastActivity || lead.last_activity);
    const daysSince = differenceInDays(now, lastTouch);
    if (daysSince > 3) {
      score += 25;
      reasons.push({ type: 'stale', text: `⏰ ${daysSince} days since contact — re-engage now`, priority: 'medium' });
    }
  } else {
    score += 20;
    reasons.push({ type: 'fresh', text: '🆕 New lead — make first impression', priority: 'medium' });
  }

  // 8) Call retry logic
  const leadCalls = calls.filter(c => c.leadId === lead.id);
  if (leadCalls.length > 0) {
    const lastCall = leadCalls[0];
    if (lastCall.status === 'Not Connected' || lastCall.status === 'Busy') {
      score += 15;
      reasons.push({ type: 'retry', text: `🔁 Retry: ${lastCall.status}`, priority: 'medium' });
    }
  }

  // AI Insights
  const bestTime = predictBestTimeToCall(lead, calls);
  const callScript = generateCallScript(lead, calls);

  return { ...lead, score, reasons, successProb, quality, bestTime, callScript };
};

// ── Main Component ────────────────────────────────────────────────
const SmartGuidance = () => {
  const { user } = useAuth();
  const { leads, calls } = useCRMData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);

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
      case 'hot':
        return scoredLeads.filter(l => l.successProb >= 70);
      case 'stale':
        return scoredLeads.filter(l => l.reasons.some(r => r.type === 'stale'));
      default:
        return scoredLeads;
    }
  }, [scoredLeads, activeTab]);

  // Summary counts
  const summary = useMemo(() => ({
    total: scoredLeads.length,
    overdue: scoredLeads.filter(l => l.reasons.some(r => r.type === 'overdue')).length,
    today: scoredLeads.filter(l => l.reasons.some(r => r.type === 'today')).length,
    hot: scoredLeads.filter(l => l.successProb >= 70).length,
    stale: scoredLeads.filter(l => l.reasons.some(r => r.type === 'stale')).length,
  }), [scoredLeads]);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getSuccessProbColor = (prob) => {
    if (prob >= 70) return 'text-green-600 bg-green-50';
    if (prob >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F] flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-600" />
            Smart Guidance AI
          </h1>
          <p className="text-gray-500">AI-powered predictions, success probability & personalized call strategies</p>
        </div>
      </div>

      {/* AI Insights Banner */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-600" />
            <div className="flex-1">
              <h3 className="font-bold text-purple-900">AI Analysis Active</h3>
              <p className="text-sm text-purple-600">Success predictions, best call times & personalized scripts generated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white cursor-pointer hover:shadow-lg transition" onClick={() => setActiveTab('overdue')}>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-red-700">{summary.overdue}</p>
            <p className="text-xs text-red-500">🔥 Overdue</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-white cursor-pointer hover:shadow-lg transition" onClick={() => setActiveTab('today')}>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-yellow-700">{summary.today}</p>
            <p className="text-xs text-yellow-600">⏰ Due Today</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white cursor-pointer hover:shadow-lg transition" onClick={() => setActiveTab('hot')}>
          <CardContent className="p-4 text-center">
            <Target className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-green-700">{summary.hot}</p>
            <p className="text-xs text-green-500">🎯 High Probability</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white cursor-pointer hover:shadow-lg transition" onClick={() => setActiveTab('stale')}>
          <CardContent className="p-4 text-center">
            <RefreshCw className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-blue-700">{summary.stale}</p>
            <p className="text-xs text-blue-500">♻️ Need Re-engage</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All ({summary.total})</TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600">🔥 Overdue ({summary.overdue})</TabsTrigger>
          <TabsTrigger value="today" className="text-yellow-600">⏰ Today ({summary.today})</TabsTrigger>
          <TabsTrigger value="hot" className="text-green-600">🎯 Hot Leads ({summary.hot})</TabsTrigger>
          <TabsTrigger value="stale" className="text-blue-600">♻️ Re-engage ({summary.stale})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredLeads.length === 0 ? (
            <div className="text-center py-16">
              <ThumbsUp className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No leads in this category</p>
              <p className="text-gray-300 text-sm mt-1">Great job staying on top of things! 🎉</p>
            </div>
          ) : (
            filteredLeads.map((lead, idx) => (
              <Card
                key={lead.id}
                className={`hover:shadow-md transition-all cursor-pointer ${
                  idx < 3 ? 'border-l-4 border-l-purple-500' : ''
                }`}
                onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {idx < 3 && (
                          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                            #{idx + 1} Top Priority
                          </span>
                        )}
                        <h3 className="font-semibold text-[#0F3A5F]">{lead.name}</h3>
                        <span className="text-sm text-gray-400">({lead.phone})</span>
                      </div>

                      {/* AI Insights Row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getSuccessProbColor(lead.successProb)}`}>
                          <Brain className="h-3 w-3" />
                          {lead.successProb}% Success
                        </div>
                        <div className="flex items-center gap-1 text-yellow-600">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < lead.quality ? 'fill-yellow-500' : ''}`} />
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          {React.createElement(lead.bestTime.icon, { className: 'h-3 w-3' })}
                          {lead.bestTime.time}
                        </div>
                      </div>

                      {/* Project & Status */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap text-xs">
                        {lead.project && <span className="text-gray-600">🏗️ {lead.project}</span>}
                        <Badge variant="outline" className="text-[10px]">{lead.status}</Badge>
                        <FollowUpBadge followUpDate={lead.follow_up_date} followUpTime={lead.follow_up_time} size="small" />
                      </div>

                      {/* Reason Chips */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {lead.reasons.slice(0, 3).map((reason, i) => (
                          <span key={i} className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getPriorityStyle(reason.priority)}`}>
                            {reason.text}
                          </span>
                        ))}
                      </div>

                      {/* Expanded AI Script */}
                      {selectedLead?.id === lead.id && (
                        <div className="mt-3 p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="h-4 w-4 text-purple-600" />
                            <h4 className="font-bold text-purple-900 text-sm">AI Call Script</h4>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div>
                              <p className="font-semibold text-purple-700">Opening:</p>
                              <p className="text-gray-700 italic">"{lead.callScript.opening}"</p>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-700">Key Points:</p>
                              <ul className="list-disc list-inside text-gray-700 space-y-1">
                                {lead.callScript.keyPoints.map((point, i) => <li key={i}>{point}</li>)}
                              </ul>
                            </div>
                            <div>
                              <p className="font-semibold text-purple-700">Closing:</p>
                              <p className="text-gray-700 italic">"{lead.callScript.closing}"</p>
                            </div>
                            <div className="pt-2 border-t border-purple-200">
                              <p className="text-purple-600 font-medium">💡 Best Time: {lead.bestTime.reason}</p>
                            </div>
                          </div>
                        </div>
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
                        Call Now
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
