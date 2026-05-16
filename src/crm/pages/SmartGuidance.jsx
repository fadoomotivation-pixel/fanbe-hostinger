import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone, MessageCircle, MapPin, Star, Clock, Brain,
  Sparkles, TrendingUp, Flame, Zap, Target, Calendar,
  Bell, AlertCircle, Trophy, BarChart2, Shield,
  Activity, ArrowUp, ArrowDown, ThumbsUp, Eye,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { format, differenceInDays, differenceInHours, isToday, isPast, parseISO, isValid } from 'date-fns';
import {
  calculateMyPerformance,
  calculateLeadMomentum,
  calculatePipelineHealth,
  generateObjectionHandlers
} from '@/crm/utils/performanceSyncEngine';

// AI Success Probability Scorer
const calculateSuccessProbability = (lead, calls, notes) => {
  let score = 50; // Base score

  const interest = lead.interestLevel || lead.interest_level || 'Warm';
  if (interest === 'Hot') score += 30;
  else if (interest === 'Warm') score += 15;
  else score -= 10;

  if (lead.budget && parseInt(lead.budget) > 0) score += 20;

  const leadCalls = calls.filter(c => c.leadId === lead.id);
  const connectedCalls = leadCalls.filter(c =>
    c.status === 'Connected' || c.status === 'connected' || c.status === 'interested'
  );
  if (connectedCalls.length > 0) score += 10;
  if (connectedCalls.length >= 2) score += 10;

  const leadNotes = Array.isArray(notes) ? notes.filter(n => n.leadId === lead.id) : [];
  if (leadNotes.length > 2) score += 10;

  const positiveWords = ['interested', 'ready', 'yes', 'good', 'like', 'want', 'need'];
  const negativeWords = ['no', 'not interested', 'busy', 'later', 'expensive'];
  leadNotes.forEach(note => {
    const text = note.text?.toLowerCase() || '';
    if (positiveWords.some(w => text.includes(w))) score += 5;
    if (negativeWords.some(w => text.includes(w))) score -= 10;
  });

  // Also check lead.notes field (string-based notes from Supabase)
  const notesText = (lead.notes || '').toLowerCase();
  if (positiveWords.some(w => notesText.includes(w))) score += 5;
  if (negativeWords.some(w => notesText.includes(w))) score -= 5;

  return Math.min(100, Math.max(0, score));
};

// Best Time to Call Predictor
const predictBestTimeToCall = (lead, calls) => {
  const leadCalls = calls.filter(c =>
    c.leadId === lead.id &&
    (c.status === 'Connected' || c.status === 'connected')
  );

  if (leadCalls.length === 0) {
    return { time: 'morning', reason: 'Try morning calls (10 AM - 12 PM)', icon: '☀️' };
  }

  const hours = leadCalls.map(c => new Date(c.timestamp).getHours());
  const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;

  if (avgHour < 12) return { time: 'morning', reason: 'Morning works best', icon: '☀️' };
  if (avgHour < 17) return { time: 'afternoon', reason: 'Afternoon preferred', icon: '🌤️' };
  return { time: 'evening', reason: 'Evening is ideal', icon: '🌙' };
};

// Generate AI Call Script
const generateCallScript = (lead, calls, notes) => {
  const leadCalls = calls.filter(c => c.leadId === lead.id);
  const lastCall = leadCalls[leadCalls.length - 1];
  const isFirstCall = leadCalls.length === 0;
  const interest = lead.interestLevel || lead.interest_level || 'Warm';

  let script = {};

  if (isFirstCall) {
    script = {
      opening: `Hi ${lead.name || 'there'}! This is [Your Name] from FanBe Group. I noticed you're interested in ${lead.project || 'our properties'}. Do you have 2 minutes?`,
      keyPoints: [
        `Confirm budget: Around ${lead.budget ? `₹${parseInt(lead.budget).toLocaleString('en-IN')}` : 'TBD'}`,
        'Highlight location advantages and ROI potential',
        'Mention current offers or limited units'
      ],
      closing: 'Would you like to schedule a site visit this week? I can arrange a convenient time for you.'
    };
  } else if (lastCall?.status === 'Not Answered' || lastCall?.status === 'Busy') {
    script = {
      opening: `Hi ${lead.name}! This is [Your Name] from FanBe Group. I tried reaching you earlier. Is this a good time to talk about ${lead.project || 'your property query'}?`,
      keyPoints: [
        'Be brief and respectful of their time',
        'Ask when would be a better time to call',
        'Send WhatsApp with property details'
      ],
      closing: 'Can I send you property details on WhatsApp? What time works better for a quick call?'
    };
  } else if (interest === 'Hot') {
    script = {
      opening: `Hello ${lead.name}! Great to connect again. I have an update about ${lead.project || 'the property'} you loved.`,
      keyPoints: [
        'Create urgency: "Only 3 units left at this price"',
        'Emphasize booking process and token amount',
        'Offer immediate site visit or virtual tour'
      ],
      closing: 'Shall I block one unit for you today with a token? We can complete paperwork tomorrow.'
    };
  } else {
    script = {
      opening: `Hi ${lead.name}! Following up on our last conversation about ${lead.project || 'the property'}.`,
      keyPoints: [
        'Address any concerns from last call',
        'Share new testimonials or similar bookings',
        'Build trust with detailed information'
      ],
      closing: 'Would a site visit help you make a decision? I can arrange it for this weekend.'
    };
  }

  return script;
};

// Calculate Lead Quality Stars
const calculateLeadStars = (lead, calls) => {
  let stars = 1;

  if (lead.budget && parseInt(lead.budget) > 0) stars++;

  const interest = lead.interestLevel || lead.interest_level || 'Cold';
  if (interest === 'Hot') stars += 2;
  else if (interest === 'Warm') stars += 1;

  const leadCalls = calls.filter(c => c.leadId === lead.id);
  if (leadCalls.length > 0) stars++;
  if (leadCalls.filter(c => c.status === 'Connected').length > 1) stars++;

  const daysSinceCreated = lead.createdAt ? differenceInDays(new Date(), new Date(lead.createdAt)) : 999;
  if (daysSinceCreated <= 2) stars++;

  return Math.min(5, stars);
};

// Safe date checker
const isFollowUpToday = (followUpDate) => {
  if (!followUpDate) return false;
  try {
    const date = typeof followUpDate === 'string' ? parseISO(followUpDate) : new Date(followUpDate);
    if (!isValid(date)) return false;
    return isToday(date) || isPast(date);
  } catch (error) {
    return false;
  }
};

// Check if follow-up is overdue
const isFollowUpOverdue = (followUpDate, followUpTime) => {
  if (!followUpDate) return false;
  try {
    const date = typeof followUpDate === 'string' ? parseISO(followUpDate) : new Date(followUpDate);
    if (!isValid(date)) return false;

    if (!followUpTime) {
      return isPast(date) && !isToday(date);
    }

    const [hours, minutes] = followUpTime.split(':');
    const followUpDateTime = new Date(date);
    followUpDateTime.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);

    return isPast(followUpDateTime);
  } catch (error) {
    return false;
  }
};

// Main Component
const SmartGuidance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leads, calls, siteVisits, bookings, employees, notes } = useCRMData();
  const [expandedScript, setExpandedScript] = useState(null);
  const [expandedObjection, setExpandedObjection] = useState(null);
  const [showAllLeads, setShowAllLeads] = useState(false);
  const [activeTab, setActiveTab] = useState('priority'); // priority | momentum | cold

  // Get user ID (supports both uid and id patterns)
  const userId = user?.uid || user?.id;

  const myLeads = useMemo(() => {
    if (!leads || !userId) return [];
    
    // Filter leads assigned to this employee only
    const filtered = leads.filter(lead => {
      const isAssigned = lead.assignedTo === userId || lead.assigned_to === userId;
      const isActive = lead.status !== 'Booked' && lead.status !== 'Lost';
      return isAssigned && isActive;
    });

    console.log('🔍 Smart Guidance Filter:', {
      userId,
      totalLeads: leads.length,
      myLeads: filtered.length,
      sampleLead: filtered[0] ? { name: filtered[0].name, assignedTo: filtered[0].assignedTo || filtered[0].assigned_to } : null
    });

    return filtered;
  }, [leads, userId]);

  // ── MY PERFORMANCE (linked from Employee Intelligence scoring) ──
  const myPerformance = useMemo(() => {
    if (!userId) return null;
    return calculateMyPerformance(userId, employees, leads, calls, siteVisits, bookings);
  }, [userId, employees, leads, calls, siteVisits, bookings]);

  // ── PIPELINE HEALTH ──
  const pipeline = useMemo(() => calculatePipelineHealth(myLeads), [myLeads]);

  // Check for today's follow-ups
  const todayFollowUps = useMemo(() => {
    if (!myLeads || myLeads.length === 0) return [];

    return myLeads.filter(lead => {
      const followUpDate = lead.followUpDate || lead.follow_up_date;
      return isFollowUpToday(followUpDate);
    }).sort((a, b) => {
      const timeA = a.followUpTime || a.follow_up_time || '00:00';
      const timeB = b.followUpTime || b.follow_up_time || '00:00';
      return timeA.localeCompare(timeB);
    });
  }, [myLeads]);

  // Prioritize leads with AI + Momentum
  const prioritizedLeads = useMemo(() => {
    if (!myLeads || myLeads.length === 0 || !calls) return [];
    const safeNotes = Array.isArray(notes) ? notes : [];

    const leadsWithScores = myLeads.map(lead => {
      const successProb = calculateSuccessProbability(lead, calls, safeNotes);
      const bestTime = predictBestTimeToCall(lead, calls);
      const stars = calculateLeadStars(lead, calls);
      const script = generateCallScript(lead, calls, safeNotes);
      const momentum = calculateLeadMomentum(lead, calls);
      const objectionHandlers = generateObjectionHandlers(lead, calls);

      const daysSinceCreated = lead.createdAt ? differenceInDays(new Date(), new Date(lead.createdAt)) : 0;
      const leadCalls = calls.filter(c => c.leadId === lead.id);
      const lastCall = leadCalls[leadCalls.length - 1];
      const hoursSinceLastCall = lastCall ? differenceInHours(new Date(), new Date(lastCall.timestamp)) : 999;

      let priorityScore = successProb;

      const interest = lead.interestLevel || lead.interest_level || 'Warm';
      if (interest === 'Hot') priorityScore += 30;
      if (daysSinceCreated <= 1) priorityScore += 20;
      if (lead.status === 'FollowUp' && hoursSinceLastCall >= 24) priorityScore += 15;
      if (leadCalls.length === 0) priorityScore += 10;
      // Momentum urgency bonus - cold leads need attention
      if (momentum.urgency >= 80) priorityScore += 15;

      let priorityReason = [];
      if (interest === 'Hot') priorityReason.push({ text: 'Hot Lead', icon: Flame, color: 'red' });
      if (daysSinceCreated <= 1) priorityReason.push({ text: 'New Lead', icon: Sparkles, color: 'blue' });
      if (lead.status === 'FollowUp') priorityReason.push({ text: 'Follow-up Due', icon: Target, color: 'orange' });
      if (leadCalls.length === 0) priorityReason.push({ text: 'Not Contacted', icon: Phone, color: 'purple' });
      if (successProb >= 70) priorityReason.push({ text: 'High Success', icon: TrendingUp, color: 'green' });
      if (momentum.status === 'cold' || momentum.status === 'going-cold') {
        priorityReason.push({ text: momentum.label, icon: AlertCircle, color: 'red' });
      }

      return {
        ...lead,
        priorityScore,
        successProb,
        bestTime,
        stars,
        script,
        priorityReason,
        momentum,
        objectionHandlers,
      };
    });

    return leadsWithScores.sort((a, b) => b.priorityScore - a.priorityScore);
  }, [myLeads, calls, notes]);

  // Cold/Going-Cold leads that need urgent attention
  const coldLeads = useMemo(() => {
    return prioritizedLeads.filter(l => l.momentum.status === 'cold' || l.momentum.status === 'going-cold');
  }, [prioritizedLeads]);

  // Leads sorted by momentum urgency
  const momentumLeads = useMemo(() => {
    return [...prioritizedLeads].sort((a, b) => b.momentum.urgency - a.momentum.urgency);
  }, [prioritizedLeads]);

  const displayLeads = activeTab === 'momentum' ? momentumLeads :
                        activeTab === 'cold' ? coldLeads : prioritizedLeads;

  const getSuccessColor = (prob) => {
    if (prob >= 70) return 'bg-green-100 text-green-800';
    if (prob >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getMomentumColor = (status) => {
    if (status === 'hot' || status === 'warm') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'cooling') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (status === 'going-cold') return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const renderStars = (count) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 p-6 rounded-lg border border-purple-200">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-[#0F3A5F]">Smart Guidance AI</h1>
        </div>
        <p className="text-gray-600">AI-powered lead prioritization with call scripts, momentum tracking & success predictions</p>
      </div>

      {/* ═══ MY PERFORMANCE CARD (linked from Employee Intelligence) ═══ */}
      {myPerformance && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-blue-900">My Performance</h2>
              <Badge className="bg-blue-600 text-white text-xs ml-auto">
                Rank #{myPerformance.rank} of {myPerformance.totalEmployees}
              </Badge>
            </div>

            {/* Daily Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-600">Today's Call Target</span>
                <span className="text-xs font-bold text-blue-700">{myPerformance.todayCalls}/{myPerformance.dailyCallTarget} calls</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    myPerformance.dailyCallProgress >= 100 ? 'bg-green-500' :
                    myPerformance.dailyCallProgress >= 60 ? 'bg-blue-500' :
                    myPerformance.dailyCallProgress >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, myPerformance.dailyCallProgress)}%` }}
                />
              </div>
              {myPerformance.dailyCallProgress >= 100 && (
                <p className="text-xs text-green-600 font-semibold mt-1">Target achieved! Keep going!</p>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="bg-white rounded-lg p-2 border">
                <p className="text-lg font-black text-blue-700">{myPerformance.todayCalls}</p>
                <p className="text-[10px] text-gray-500">Today Calls</p>
              </div>
              <div className="bg-white rounded-lg p-2 border">
                <p className="text-lg font-black text-green-700">{myPerformance.todayConnected}</p>
                <p className="text-[10px] text-gray-500">Connected</p>
              </div>
              <div className="bg-white rounded-lg p-2 border">
                <p className="text-lg font-black text-purple-700">{myPerformance.weeklyVisits}</p>
                <p className="text-[10px] text-gray-500">Week Visits</p>
              </div>
              <div className="bg-white rounded-lg p-2 border">
                <p className="text-lg font-black text-amber-700">{myPerformance.weeklyBookings}</p>
                <p className="text-[10px] text-gray-500">Week Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ PIPELINE HEALTH ═══ */}
      {pipeline.total > 0 && (
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart2 className="h-4 w-4 text-gray-600" />
              <h3 className="font-bold text-sm text-gray-800">My Pipeline</h3>
              <span className="text-xs text-gray-400 ml-auto">{pipeline.total} active leads</span>
            </div>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-2">
              {pipeline.hotPercent > 0 && (
                <div className="bg-red-500 transition-all" style={{ width: `${pipeline.hotPercent}%` }} />
              )}
              {pipeline.warmPercent > 0 && (
                <div className="bg-yellow-500 transition-all" style={{ width: `${pipeline.warmPercent}%` }} />
              )}
              {pipeline.coldPercent > 0 && (
                <div className="bg-blue-400 transition-all" style={{ width: `${pipeline.coldPercent}%` }} />
              )}
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Hot: {pipeline.hot} ({pipeline.hotPercent}%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Warm: {pipeline.warm} ({pipeline.warmPercent}%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Cold: {pipeline.cold} ({pipeline.coldPercent}%)</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ TODAY'S FOLLOW-UPS - PRIORITY SECTION ═══ */}
      {todayFollowUps.length > 0 && (
        <Card className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-6 w-6 text-orange-600 animate-bounce" />
              <h2 className="text-xl font-bold text-orange-900">Today's Follow-ups ({todayFollowUps.length})</h2>
            </div>
            <div className="space-y-3">
              {todayFollowUps.map((lead) => {
                const followUpDate = lead.followUpDate || lead.follow_up_date;
                const followUpTime = lead.followUpTime || lead.follow_up_time || 'Anytime';
                const isOverdue = isFollowUpOverdue(followUpDate, followUpTime);

                return (
                  <Card
                    key={lead.id}
                    className={`cursor-pointer hover:shadow-md transition ${
                      isOverdue ? 'border-2 border-red-400 bg-red-50' : 'border border-orange-200 bg-white'
                    }`}
                    onClick={() => navigate(`/crm/lead/${lead.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-gray-900">{lead.name}</h3>
                            {isOverdue && (
                              <Badge className="bg-red-500 text-white text-xs animate-pulse">
                                OVERDUE
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Phone size={14} />
                              {lead.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {followUpTime}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Project: {lead.project || 'N/A'}</p>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${lead.phone}`;
                          }}
                          className="bg-orange-600 hover:bg-orange-700 h-12 px-6"
                        >
                          <Phone size={18} className="mr-2" />
                          Call Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ COLD LEADS ALERT ═══ */}
      {coldLeads.length > 0 && (
        <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-red-900">Leads Going Cold ({coldLeads.length})</h3>
            </div>
            <p className="text-xs text-red-700 mb-3">These leads haven't been contacted recently and may be lost if not acted on now.</p>
            <div className="flex flex-wrap gap-2">
              {coldLeads.slice(0, 5).map(lead => (
                <Badge
                  key={lead.id}
                  className="bg-red-100 text-red-800 cursor-pointer hover:bg-red-200"
                  onClick={() => navigate(`/crm/lead/${lead.id}`)}
                >
                  {lead.name} - {lead.momentum.label}
                </Badge>
              ))}
              {coldLeads.length > 5 && (
                <Badge className="bg-gray-100 text-gray-600">+{coldLeads.length - 5} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ TAB FILTERS ═══ */}
      <div className="flex gap-2">
        {[
          { key: 'priority', label: 'Priority', icon: Zap, count: prioritizedLeads.length },
          { key: 'momentum', label: 'Momentum', icon: Activity, count: prioritizedLeads.length },
          { key: 'cold', label: 'Needs Action', icon: AlertCircle, count: coldLeads.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <tab.icon size={16} />
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* ═══ LEADS LIST ═══ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">
            {activeTab === 'priority' ? 'Priority Leads' : activeTab === 'momentum' ? 'By Momentum' : 'Needs Immediate Action'}
            {' '}({displayLeads.length})
          </h2>
        </div>

        {displayLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">
                {activeTab === 'cold' ? 'Great! No leads are going cold right now.' : 'No leads assigned to you yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {(showAllLeads ? displayLeads : displayLeads.slice(0, 10)).map((lead, index) => (
              <Card
                key={lead.id}
                className={`cursor-pointer hover:shadow-lg transition ${
                  index < 3 && activeTab === 'priority' ? 'border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-white' : ''
                } ${lead.momentum.urgency >= 80 ? 'border-l-4 border-l-red-400' : ''}`}
                onClick={() => {
                  if (expandedScript === lead.id || expandedObjection === lead.id) {
                    setExpandedScript(null);
                    setExpandedObjection(null);
                  } else {
                    navigate(`/crm/lead/${lead.id}`);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {index < 3 && activeTab === 'priority' && (
                          <Badge className="bg-purple-600 text-white font-bold">#{index + 1}</Badge>
                        )}
                        <h3 className="font-bold text-lg text-gray-900">{lead.name}</h3>
                        <Badge className={getSuccessColor(lead.successProb)}>
                          {lead.successProb}% Success
                        </Badge>
                        {/* Momentum Badge */}
                        <Badge className={`text-[10px] ${getMomentumColor(lead.momentum.status)}`}>
                          {lead.momentum.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(lead.stars)}
                        <span className="text-xs text-gray-500 ml-2">Quality Score</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        {lead.priorityReason.map((reason, i) => {
                          const Icon = reason.icon;
                          return (
                            <Badge key={i} variant="outline" className="text-xs">
                              <Icon size={12} className="mr-1" />
                              {reason.text}
                            </Badge>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600 mb-3">
                        <span>📞 {lead.phone}</span>
                        <span>🏗️ {lead.project || 'N/A'}</span>
                        <span>💰 ₹{lead.budget ? parseInt(lead.budget).toLocaleString('en-IN') : 'TBD'}</span>
                        <span>{lead.bestTime.icon} {lead.bestTime.reason}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedScript(expandedScript === lead.id ? null : lead.id);
                            setExpandedObjection(null);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Sparkles size={14} className="mr-1" />
                          {expandedScript === lead.id ? 'Hide' : 'View'} AI Script
                        </Button>
                        {lead.objectionHandlers.length > 0 && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedObjection(expandedObjection === lead.id ? null : lead.id);
                              setExpandedScript(null);
                            }}
                            variant="outline"
                            size="sm"
                            className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                          >
                            <Shield size={14} className="mr-1" />
                            {expandedObjection === lead.id ? 'Hide' : ''} Objection Tips
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `tel:${lead.phone}`;
                        }}
                        className="bg-blue-600 hover:bg-blue-700 h-12 px-6"
                      >
                        <Phone size={18} className="mr-2" />
                        Call
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://wa.me/91${lead.phone}`, '_blank');
                        }}
                        className="bg-green-600 hover:bg-green-700 h-12 px-6"
                      >
                        <MessageCircle size={18} className="mr-2" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>

                  {/* EXPANDED AI SCRIPT */}
                  {expandedScript === lead.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-5 w-5 text-blue-600" />
                        <h4 className="font-bold text-blue-900">AI Call Script</h4>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-1">Opening Line:</p>
                          <p className="text-sm text-gray-800 italic bg-white p-2 rounded">"{lead.script.opening}"</p>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-1">Key Talking Points:</p>
                          <ul className="text-sm space-y-1 bg-white p-3 rounded">
                            {lead.script.keyPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-1">Closing Question:</p>
                          <p className="text-sm text-gray-800 italic bg-white p-2 rounded">"{lead.script.closing}"</p>
                        </div>

                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                          <p className="text-xs text-yellow-800">
                            <strong>Best Time:</strong> {lead.bestTime.icon} {lead.bestTime.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EXPANDED OBJECTION HANDLERS */}
                  {expandedObjection === lead.id && lead.objectionHandlers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-orange-600" />
                        <h4 className="font-bold text-orange-900">Objection Handling Guide</h4>
                      </div>
                      <div className="space-y-3">
                        {lead.objectionHandlers.map((handler, i) => (
                          <div key={i} className="bg-white p-3 rounded-lg border border-orange-200">
                            <p className="text-xs font-bold text-red-700 mb-1">If they say: {handler.objection}</p>
                            <p className="text-sm text-gray-800">{handler.response}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Show More / Less */}
            {displayLeads.length > 10 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAllLeads(!showAllLeads)}
              >
                {showAllLeads ? (
                  <><ChevronUp size={16} className="mr-2" /> Show Less</>
                ) : (
                  <><ChevronDown size={16} className="mr-2" /> Show All {displayLeads.length} Leads</>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartGuidance;
