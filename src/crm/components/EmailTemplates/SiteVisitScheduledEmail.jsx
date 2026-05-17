
import React from 'react';
import EmailTemplate from './EmailTemplate';

const SiteVisitScheduledEmail = ({ lead, date, time, location, executiveName }) => {
  return (
    <EmailTemplate title="Site Visit Confirmation">
      <p>Dear {lead.name},</p>
      <p>Your site visit has been successfully scheduled. We look forward to showing you your future home.</p>
      
      <div className="bg-[#0F3A5F] text-white p-6 rounded-lg my-6 text-center">
        <div className="text-3xl font-bold mb-2">{new Date(date).toLocaleDateString()}</div>
        <div className="text-xl text-[#D4AF37]">{time || '10:00 AM'}</div>
        <div className="mt-4 text-sm opacity-80">{location}</div>
      </div>

      <p><strong>Assigned Executive:</strong> {executiveName}</p>
      <p>Please feel free to contact us if you need to reschedule.</p>
    </EmailTemplate>
  );
};

export default SiteVisitScheduledEmail;
