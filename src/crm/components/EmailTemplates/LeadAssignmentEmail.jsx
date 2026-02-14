
import React from 'react';
import EmailTemplate from './EmailTemplate';

const LeadAssignmentEmail = ({ lead, executiveName }) => {
  return (
    <EmailTemplate title="New Lead Assignment">
      <p>Hello <strong>{executiveName}</strong>,</p>
      <p>A new lead has been assigned to you. Please take immediate action.</p>
      
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 my-4">
        <h3 className="font-bold text-[#0F3A5F] mb-2">Lead Details</h3>
        <ul className="space-y-2 text-sm">
          <li><strong>Name:</strong> {lead.name}</li>
          <li><strong>Phone:</strong> {lead.phone}</li>
          <li><strong>Email:</strong> {lead.email}</li>
          <li><strong>Project:</strong> {lead.project}</li>
          <li><strong>Source:</strong> {lead.source}</li>
          <li><strong>Date:</strong> {new Date().toLocaleDateString()}</li>
        </ul>
      </div>

      <p>Please contact the lead within 2 hours to maintain our service standards.</p>
      
      <div className="mt-6 text-center">
        <span className="inline-block bg-[#D4AF37] text-[#0F3A5F] font-bold px-6 py-3 rounded text-sm">
          View Lead in CRM
        </span>
      </div>
    </EmailTemplate>
  );
};

export default LeadAssignmentEmail;
