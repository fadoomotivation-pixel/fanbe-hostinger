
import React from 'react';
import EmailTemplate from './EmailTemplate';

const EmployeeSuspensionEmail = ({ employee, reason }) => {
  return (
    <EmailTemplate title="Account Suspension Notice">
      <p>Dear {employee.name},</p>
      <p>This email is to inform you that your access to the Fanbe CRM has been suspended effective immediately.</p>
      
      <div className="bg-red-50 border border-red-200 p-4 rounded my-6">
        <strong>Reason for Suspension:</strong>
        <p className="text-red-700 mt-1">{reason}</p>
      </div>

      <p>If you believe this is an error or wish to appeal this decision, please contact the Super Admin office immediately.</p>
      
      <p className="mt-4 text-sm text-gray-500">
        <strong>Employee ID:</strong> {employee.id}<br />
        <strong>Suspension Date:</strong> {new Date().toLocaleDateString()}
      </p>
    </EmailTemplate>
  );
};

export default EmployeeSuspensionEmail;
