import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertCircle, Calendar, Clock } from 'lucide-react';
import { useLeadPriority } from '@/crm/hooks/useLeadPriority';
import { useAuth } from '@/context/AuthContext';

const FollowUpSummaryWidget = ({ leads, showAllLeads = false }) => {
  const { user } = useAuth();

  // Filter leads by current user unless admin viewing all
  const filterOptions = showAllLeads ? {} : { filterByAssignee: user?.id };
  const { summary } = useLeadPriority(leads, filterOptions);

  const summaryItems = [
    {
      label: 'Overdue',
      count: summary.overdue,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      description: 'Need immediate attention'
    },
    {
      label: 'Today',
      count: summary.today,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      description: 'Follow-ups scheduled for today'
    },
    {
      label: 'Tomorrow',
      count: summary.tomorrow,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      description: 'Scheduled for tomorrow'
    },
    {
      label: 'This Week',
      count: summary.thisWeek,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      description: 'Coming up this week'
    }
  ];

  const urgentCount = summary.overdue + summary.today;

  return (
    <Card className={`${
      urgentCount > 0 
        ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50' 
        : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'
    }`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className={urgentCount > 0 ? 'text-red-600' : 'text-blue-600'} size={20} />
          {showAllLeads ? 'Team Follow-ups' : 'My Follow-ups'}
          {urgentCount > 0 && (
            <span className="ml-auto bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              {urgentCount} Urgent
            </span>
          )}
        </CardTitle>
        <CardDescription>
          {showAllLeads ? 'Team-wide follow-up schedule' : 'Your scheduled callbacks and follow-ups'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-3">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className={`${item.bgColor} ${item.borderColor} border rounded-lg p-3 transition-all hover:shadow-sm cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-2">
                <item.icon className={item.color} size={18} />
                <span className={`text-2xl font-bold ${item.color}`}>
                  {item.count}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-700">{item.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Action Message */}
        {urgentCount > 0 ? (
          <div className="bg-red-100 border border-red-300 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="text-red-600 shrink-0" size={16} />
              <div>
                <p className="text-xs text-red-800 font-medium">
                  ⚠️ {urgentCount} {urgentCount === 1 ? 'lead needs' : 'leads need'} immediate follow-up
                </p>
                <p className="text-xs text-red-700 mt-1">
                  These calls should be prioritized today
                </p>
              </div>
            </div>
          </div>
        ) : summary.total > 0 ? (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3">
            <p className="text-xs text-green-800 text-center font-medium">
              ✅ All caught up! No urgent follow-ups right now
            </p>
          </div>
        ) : (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
            <p className="text-xs text-gray-600 text-center">
              📅 No follow-ups scheduled. Schedule callbacks to stay organized!
            </p>
          </div>
        )}

        {/* Total Counter */}
        {summary.total > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-gray-500">Total Scheduled</span>
            <span className="text-sm font-bold text-gray-700">{summary.total} follow-ups</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowUpSummaryWidget;
