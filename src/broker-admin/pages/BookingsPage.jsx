import React from 'react';
import ModulePage from '../components/ModulePage';
import { formatINR } from '../lib/formatters';

const BookingsPage = () => (
  <ModulePage
    title="Bookings"
    table="bp_bookings"
    description="Master booking lifecycle with stage progression support and payout-facing visibility."
    columns={[
      { key: 'booking_no', label: 'Booking No' },
      { key: 'project_id', label: 'Project' },
      { key: 'plot_id', label: 'Plot' },
      { key: 'customer_id', label: 'Customer' },
      { key: 'broker_id', label: 'Broker' },
      { key: 'stage', label: 'Stage' },
      { key: 'plot_total_price', label: 'Plot Price', render: (v) => formatINR(v) },
      { key: 'total_collected', label: 'Collected', render: (v) => formatINR(v) },
      { key: 'balance_due', label: 'Balance', render: (v) => formatINR(v) },
      { key: 'commission_status', label: 'Commission' },
    ]}
    defaultForm={{ booking_no: '', project_id: '', plot_id: '', customer_id: '', broker_id: '', stage: 'token', plot_total_price: '', token_amount: '', booking_amount: '', full_payment_amount: '', total_collected: '', balance_due: '', commission_amount: '', commission_status: 'pending' }}
  />
);

export default BookingsPage;
