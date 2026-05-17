
import React from 'react';
import EmailTemplate from './EmailTemplate';

const DailyDigestEmail = ({ stats }) => {
  return (
    <EmailTemplate title={`Daily CRM Digest - ${new Date().toLocaleDateString()}`}>
      <p>Good Morning Admin,</p>
      <p>Here is the summary of yesterday's activity across the CRM.</p>

      <div className="grid grid-cols-2 gap-4 my-6">
        <div className="bg-blue-50 p-4 rounded text-center">
          <div className="text-2xl font-bold text-blue-800">{stats.newLeads}</div>
          <div className="text-xs text-blue-600 uppercase">New Leads</div>
        </div>
        <div className="bg-green-50 p-4 rounded text-center">
          <div className="text-2xl font-bold text-green-800">{stats.siteVisits}</div>
          <div className="text-xs text-green-600 uppercase">Site Visits</div>
        </div>
        <div className="bg-purple-50 p-4 rounded text-center">
          <div className="text-2xl font-bold text-purple-800">{stats.bookings}</div>
          <div className="text-xs text-purple-600 uppercase">Bookings</div>
        </div>
        <div className="bg-red-50 p-4 rounded text-center">
          <div className="text-2xl font-bold text-red-800">{stats.unassigned}</div>
          <div className="text-xs text-red-600 uppercase">Unassigned</div>
        </div>
      </div>

      {stats.topPerformer && (
        <div className="bg-[#D4AF37]/10 p-4 rounded border border-[#D4AF37] mb-6">
          <h3 className="font-bold text-[#0F3A5F] flex items-center">
            🏆 Top Performer of the Day
          </h3>
          <p className="text-lg">{stats.topPerformer.name} ({stats.topPerformer.actionCount} actions)</p>
        </div>
      )}

      <p className="text-sm text-center">
        <a href="#" className="text-blue-600 hover:underline">Log in to CRM for full details</a>
      </p>
    </EmailTemplate>
  );
};

export default DailyDigestEmail;
