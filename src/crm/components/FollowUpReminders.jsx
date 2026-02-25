import React, { useState, useEffect } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Phone, Check, Calendar, AlertCircle } from 'lucide-react';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

const FollowUpReminders = () => {
  const { user } = useAuth();
  const { leads, tasks, addTask, updateTask, updateLead } = useCRMData();
  const { toast } = useToast();
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    // Filter leads assigned to current user with follow-up dates
    const myLeads = leads.filter(l => 
      l.assignedTo === user?.id && 
      l.followUpDate && 
      l.status !== 'Booked' && 
      l.status !== 'Lost'
    );

    // Sort by follow-up date (earliest first)
    const sortedLeads = myLeads.sort((a, b) => {
      const dateA = new Date(a.followUpDate);
      const dateB = new Date(b.followUpDate);
      return dateA - dateB;
    });

    // Group by priority
    const overdueLeads = sortedLeads.filter(l => isPast(parseISO(l.followUpDate)) && !isToday(parseISO(l.followUpDate)));
    const todayLeads = sortedLeads.filter(l => isToday(parseISO(l.followUpDate)));
    const tomorrowLeads = sortedLeads.filter(l => isTomorrow(parseISO(l.followUpDate)));
    const upcomingLeads = sortedLeads.filter(l => 
      !isPast(parseISO(l.followUpDate)) && 
      !isToday(parseISO(l.followUpDate)) && 
      !isTomorrow(parseISO(l.followUpDate))
    ).slice(0, 5);

    setReminders({
      overdue: overdueLeads,
      today: todayLeads,
      tomorrow: tomorrowLeads,
      upcoming: upcomingLeads,
    });

    // Show toast notification for today's follow-ups
    if (todayLeads.length > 0) {
      const existingNotification = localStorage.getItem('followup_notification_today');
      const today = new Date().toDateString();
      
      if (existingNotification !== today) {
        toast({
          title: '🔔 Follow-up Reminders',
          description: `You have ${todayLeads.length} lead(s) to follow up today!`,
          duration: 5000,
        });
        localStorage.setItem('followup_notification_today', today);
      }
    }
  }, [leads, user, toast]);

  const handleCreateTask = (lead) => {
    addTask({
      title: `Follow up with ${lead.name}`,
      description: `Call ${lead.name} (${lead.phone}) for ${lead.project}`,
      type: 'Follow-up Call',
      priority: isToday(parseISO(lead.followUpDate)) ? 'High' : 'Medium',
      deadline: lead.followUpDate,
      employeeId: user?.id,
      leadId: lead.id,
    });

    toast({
      title: 'Task Created',
      description: `Follow-up task created for ${lead.name}`,
    });
  };

  const handleMarkComplete = async (lead) => {
    await updateLead(lead.id, {
      followUpDate: null,
      lastActivity: new Date().toISOString(),
    });

    toast({
      title: 'Marked Complete',
      description: `Follow-up completed for ${lead.name}`,
    });
  };

  const getPriorityColor = (followUpDate) => {
    const date = parseISO(followUpDate);
    if (isPast(date) && !isToday(date)) return 'bg-red-100 text-red-800';
    if (isToday(date)) return 'bg-orange-100 text-orange-800';
    if (isTomorrow(date)) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const renderLeadItem = (lead, priority) => (
    <div key={lead.id} className="flex items-start justify-between py-3 border-b last:border-0">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm">{lead.name}</p>
          <Badge className={`text-xs ${getPriorityColor(lead.followUpDate)}`}>
            {priority}
          </Badge>
        </div>
        <p className="text-xs text-gray-600">{lead.project || 'General'}</p>
        <p className="text-xs text-gray-500 mt-1">
          <Calendar className="inline h-3 w-3 mr-1" />
          {format(parseISO(lead.followUpDate), 'MMM dd, yyyy')}
        </p>
      </div>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => window.location.href = `tel:${lead.phone}`}
        >
          <Phone className="h-3 w-3" />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => handleMarkComplete(lead)}
        >
          <Check className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  const totalReminders = 
    (reminders.overdue?.length || 0) + 
    (reminders.today?.length || 0) + 
    (reminders.tomorrow?.length || 0) + 
    (reminders.upcoming?.length || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-600" />
            Follow-up Reminders
          </div>
          {totalReminders > 0 && (
            <Badge variant="secondary">{totalReminders}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalReminders === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No upcoming follow-ups</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overdue */}
            {reminders.overdue && reminders.overdue.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h4 className="text-sm font-semibold text-red-600">Overdue ({reminders.overdue.length})</h4>
                </div>
                <div className="space-y-0">
                  {reminders.overdue.map(lead => renderLeadItem(lead, 'Overdue'))}
                </div>
              </div>
            )}

            {/* Today */}
            {reminders.today && reminders.today.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <h4 className="text-sm font-semibold text-orange-600">Today ({reminders.today.length})</h4>
                </div>
                <div className="space-y-0">
                  {reminders.today.map(lead => renderLeadItem(lead, 'Today'))}
                </div>
              </div>
            )}

            {/* Tomorrow */}
            {reminders.tomorrow && reminders.tomorrow.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-600 mb-2">Tomorrow ({reminders.tomorrow.length})</h4>
                <div className="space-y-0">
                  {reminders.tomorrow.map(lead => renderLeadItem(lead, 'Tomorrow'))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {reminders.upcoming && reminders.upcoming.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-blue-600 mb-2">Upcoming</h4>
                <div className="space-y-0">
                  {reminders.upcoming.map(lead => renderLeadItem(lead, 'Upcoming'))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowUpReminders;
