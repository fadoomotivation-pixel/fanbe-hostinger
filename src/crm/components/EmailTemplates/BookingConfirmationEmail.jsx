
import React from 'react';
import EmailTemplate from './EmailTemplate';

const BookingConfirmationEmail = ({ lead, project, bookingDate }) => {
  return (
    <EmailTemplate title="Congratulations! Booking Confirmed">
      <p>Dear {lead.name},</p>
      <p className="text-lg text-[#0F3A5F]">Congratulations on your new investment in <strong>{project}</strong>!</p>
      
      <p>We are delighted to welcome you to the Fanbe Group family. Your booking has been officially recorded.</p>
      
      <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
        <p className="font-bold text-green-800">Booking Reference: BK-{lead.id.split('LEAD')[1]}-{Date.now().toString().slice(-4)}</p>
        <p className="text-sm text-green-700">Date: {new Date(bookingDate).toLocaleDateString()}</p>
      </div>

      <h3 className="font-bold text-gray-800 mb-2">Next Steps:</h3>
      <ol className="list-decimal pl-5 space-y-2 text-sm mb-6">
        <li>Verification of documents (KYC)</li>
        <li>Allotment Letter issuance (within 7 days)</li>
        <li>Agreement to Sale execution</li>
      </ol>

      <p>Our CRM team will be in touch shortly to guide you through the process.</p>
    </EmailTemplate>
  );
};

export default BookingConfirmationEmail;
