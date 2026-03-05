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
  Bell, AlertCircle
} from 'lucide-react';
import { format, differenceInDays, differenceInHours, isToday, isPast, parseISO, isSameDay } from 'date-fns';

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

  const leadNotes = notes.filter(n => n.leadId === lead.id);
  if (leadNotes.length > 2) score += 10;

  const positiveWords = ['interested', 'ready', 'yes', 'good', 'like', 'want', 'need'];
  const negativeWords = ['no', 'not interested', 'busy', 'later', 'expensive'];
  leadNotes.forEach(note => {
    const text = note.text?.toLowerCase() || '';
    if (positiveWords.some(w => text.includes(w))) score += 5;
    if (negativeWords.some(w => text.includes(w))) score -= 10;
  });

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

// Main Component
const SmartGuidance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { leads, calls, siteVisits, notes } = useCRMData();
  const [expandedScript, setExpandedScript] = useState(null);

  const myLeads = useMemo(() => {
    return leads.filter(lead => 
      (lead.assignedTo === user?.uid || lead.assigned_to === user?.uid) &&
      lead.status !== 'Booked' &&
      lead.status !== 'Lost'
    );
  }, [leads, user]);

  // Check for today's follow-ups
  const todayFollowUps = useMemo(() => {
    return myLeads.filter(lead => {
      const followUpDate = lead.followUpDate || lead.follow_up_date;
      if (!followUpDate) return false;
      
      try {
        const followUp = parseISO(followUpDate);
        return isToday(followUp) || isPast(followUp);
      } catch {
        return false;
      }
    }).sort((a, b) => {
      const timeA = a.followUpTime || a.follow_up_time || '00:00';
      const timeB = b.followUpTime || b.follow_up_time || '00:00';
      return timeA.localeCompare(timeB);
    });
  }, [myLeads]);

  // Prioritize leads with AI
  const prioritizedLeads = useMemo(() => {
    const leadsWithScores = myLeads.map(lead => {
      const successProb = calculateSuccessProbability(lead, calls, notes);
      const bestTime = predictBestTimeToCall(lead, calls);
      const stars = calculateLeadStars(lead, calls);
      const script = generateCallScript(lead, calls, notes);

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

      let priorityReason = [];
      if (interest === 'Hot') priorityReason.push({ text: 'Hot Lead', icon: Flame, color: 'red' });
      if (daysSinceCreated <= 1) priorityReason.push({ text: 'New Lead', icon: Sparkles, color: 'blue' });
      if (lead.status === 'FollowUp') priorityReason.push({ text: 'Follow-up Due', icon: Target, color: 'orange' });
      if (leadCalls.length === 0) priorityReason.push({ text: 'Not Contacted', icon: Phone, color: 'purple' });
      if (successProb >= 70) priorityReason.push({ text: 'High Success', icon: TrendingUp, color: 'green' });

      return {
        ...lead,
        priorityScore,
        successProb,
        bestTime,
        stars,
        script,
        priorityReason
      };
    });

    return leadsWithScores.sort((a, b) => b.priorityScore - a.priorityScore);
  }, [myLeads, calls, notes]);

  const getSuccessColor = (prob) => {
    if (prob >= 70) return 'bg-green-100 text-green-800';
    if (prob >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
        <p className="text-gray-600">AI-powered lead prioritization with call scripts and success predictions</p>
      </div>

      {/* TODAY'S FOLLOW-UPS - PRIORITY SECTION */}
      {todayFollowUps.length > 0 && (
        <Card className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-6 w-6 text-orange-600 animate-bounce" />
              <h2 className="text-xl font-bold text-orange-900">🔔 Today's Follow-ups ({todayFollowUps.length})</h2>
            </div>
            <div className="space-y-3">
              {todayFollowUps.map((lead) => {
                const followUpTime = lead.followUpTime || lead.follow_up_time || 'Anytime';
                const isOverdue = isPast(parseISO(`${lead.followUpDate || lead.follow_up_date}T${followUpTime}`));
                
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

      {/* PRIORITY LEADS LIST */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-bold text-gray-900">Priority Leads ({prioritizedLeads.length})</h2>
        </div>

        {prioritizedLeads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No leads assigned to you yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {prioritizedLeads.map((lead, index) => (
              <Card 
                key={lead.id} 
                className={`cursor-pointer hover:shadow-lg transition ${
                  index < 3 ? 'border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-white' : ''
                }`}
                onClick={() => {
                  if (expandedScript === lead.id) {
                    setExpandedScript(null);
                  } else {
                    navigate(`/crm/lead/${lead.id}`);
                  }
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {index < 3 && (
                          <Badge className="bg-purple-600 text-white font-bold">#{index + 1}</Badge>
                        )}
                        <h3 className="font-bold text-lg text-gray-900">{lead.name}</h3>
                        <Badge className={getSuccessColor(lead.successProb)}>
                          {lead.successProb}% Success
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

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedScript(expandedScript === lead.id ? null : lead.id);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        <Sparkles size={14} className="mr-1" />
                        {expandedScript === lead.id ? 'Hide' : 'View'} AI Script
                      </Button>
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
                          <p className="text-xs font-bold text-gray-700 mb-1">🎤 Opening Line:</p>
                          <p className="text-sm text-gray-800 italic bg-white p-2 rounded">"{lead.script.opening}"</p>
                        </div>
                        
                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-1">🔑 Key Talking Points:</p>
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
                          <p className="text-xs font-bold text-gray-700 mb-1">🎯 Closing Question:</p>
                          <p className="text-sm text-gray-800 italic bg-white p-2 rounded">"{lead.script.closing}"</p>
                        </div>

                        <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                          <p className="text-xs text-yellow-800">
                            <strong>💡 Best Time:</strong> {lead.bestTime.icon} {lead.bestTime.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartGuidance;
