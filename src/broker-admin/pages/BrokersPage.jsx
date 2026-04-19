import React from 'react';
import ModulePage from '../components/ModulePage';

const BrokersPage = () => (
  <ModulePage
    title="Brokers"
    table="brokers"
    description="Broker master with rank, hierarchy pointers, KYC state and payout eligibility indicators."
    columns={[
      { key: 'broker_id', label: 'Broker ID' },
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'referral_code', label: 'Referral Code' },
      { key: 'rank', label: 'Rank' },
      { key: 'status', label: 'Status' },
      { key: 'kyc_status', label: 'KYC' },
      { key: 'tds_applicable', label: 'TDS' },
    ]}
    defaultForm={{ broker_id: '', name: '', phone: '', email: '', referral_code: '', rank: '', status: 'pending', kyc_status: 'pending', pan_no: '', gst_no: '', tds_applicable: 'true', parent_id: '' }}
  />
);

export default BrokersPage;
