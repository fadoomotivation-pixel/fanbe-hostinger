import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, TrendingUp, Award, Target } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const MyPerformanceWidget = ({ leads }) => {
  const { user } = useAuth();

  const myStats = useMemo(() => {
    const myLeads = leads?.filter(lead => lead.assigned_to === user?.id) || [];

    const stats = {
      totalTokens: 0,
      tokenCount: 0,
      totalBookings: 0,
      bookingCount: 0,
      totalRevenue: 0,
      thisMonthTokens: 0,
      thisMonthBookings: 0
    };

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    myLeads.forEach(lead => {
      // All time stats
      if (lead.token_amount && lead.token_amount > 0) {
        stats.totalTokens += parseFloat(lead.token_amount);
        stats.tokenCount++;
      }

      if (lead.booking_amount && lead.booking_amount > 0) {
        stats.totalBookings += parseFloat(lead.booking_amount);
        stats.bookingCount++;
      }

      // This month stats
      if (lead.token_date && new Date(lead.token_date) >= firstDayOfMonth) {
        stats.thisMonthTokens += parseFloat(lead.token_amount || 0);
      }

      if (lead.booking_date && new Date(lead.booking_date) >= firstDayOfMonth) {
        stats.thisMonthBookings += parseFloat(lead.booking_amount || 0);
      }
    });

    stats.totalRevenue = stats.totalTokens + stats.totalBookings;

    return stats;
  }, [leads, user]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatShort = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Award className="text-blue-600" size={20} />
          My Performance
        </CardTitle>
        <CardDescription>Your sales achievements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Revenue Card */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(myStats.totalRevenue)}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        {/* Tokens and Bookings Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tokens */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee className="text-amber-600" size={16} />
              <p className="text-xs font-medium text-amber-800">Tokens</p>
            </div>
            <p className="text-lg font-bold text-amber-900">
              {formatShort(myStats.totalTokens)}
            </p>
            <p className="text-xs text-amber-600 mt-1">
              {myStats.tokenCount} received
            </p>
          </div>

          {/* Bookings */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-green-600" size={16} />
              <p className="text-xs font-medium text-green-800">Bookings</p>
            </div>
            <p className="text-lg font-bold text-green-900">
              {formatShort(myStats.totalBookings)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {myStats.bookingCount} confirmed
            </p>
          </div>
        </div>

        {/* This Month Performance */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <p className="text-xs font-medium text-gray-600 mb-2">📅 This Month</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Tokens</p>
              <p className="text-sm font-bold text-amber-700">
                {formatShort(myStats.thisMonthTokens)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Bookings</p>
              <p className="text-sm font-bold text-green-700">
                {formatShort(myStats.thisMonthBookings)}
              </p>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        {myStats.totalRevenue > 0 ? (
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg p-3 border border-green-300">
            <p className="text-xs text-green-800 font-medium">
              🎉 Great job! Keep closing more deals!
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-3 border border-blue-300">
            <p className="text-xs text-blue-800 font-medium">
              🚀 Start recording your sales to track performance!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MyPerformanceWidget;
