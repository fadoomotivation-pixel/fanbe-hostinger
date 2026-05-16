import React from 'react';
import ModulePage from '../components/ModulePage';
import { formatINR } from '../lib/formatters';

const PayoutQueuePage = () => (
  <ModulePage
    title="Payout Queue"
    table="bp_payout_transactions"
    description="Operational payout queue for approval, hold/reject actions, and paid marking with audit-safe notes."
    columns={[
      { key: 'broker_id', label: 'Broker' },
      { key: 'booking_id', label: 'Booking' },
      { key: 'payout_type', label: 'Payout Type' },
      { key: 'amount', label: 'Gross', render: (v) => formatINR(v) },
      { key: 'tds_amount', label: 'TDS', render: (v) => formatINR(v) },
      { key: 'net_amount', label: 'Net', render: (v) => formatINR(v) },
      { key: 'status', label: 'Status' },
      { key: 'approver_name', label: 'Approved By' },
      { key: 'paid_date', label: 'Paid Date' },
      { key: 'utr_ref', label: 'UTR' },
    ]}
    defaultForm={{ broker_id: '', booking_id: '', payout_type: 'commission', amount: '', status: 'pending', payment_mode: '', utr_ref: '', bank_ref: '', paid_date: '', tds_amount: '', net_amount: '', notes: '', rejection_reason: '' }}
  />
);

export default PayoutQueuePage;
