
import React from 'react';
import EmailTemplate from './EmailTemplate';

const LeadStatusChangeEmail = ({ lead, oldStatus, newStatus, updatedBy }) => {
  return (
    <EmailTemplate title="Lead Status Update">
      <p>Hello Team,</p>
      <p>The status for the following lead has been updated by <strong>{updatedBy}</strong>.</p>
      
      <div className="grid grid-cols-2 gap-4 my-6">
        <div className="text-center p-3 bg-gray-100 rounded">
          <div className="text-xs text-gray-500 uppercase">Previous Status</div>
          <div className="font-bold text-gray-600">{oldStatus}</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded border border-green-200">
          <div className="text-xs text-gray-500 uppercase">New Status</div>
          <div className="font-bold text-green-700">{newStatus}</div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded text-sm">
        <strong>Lead:</strong> {lead.name} ({lead.id})<br />
        <strong>Project:</strong> {lead.project}
      </div>
    </EmailTemplate>
  );
};

export default LeadStatusChangeEmail;
