import React from 'react';
import ModulePage from '../components/ModulePage';

const ReportsPage = () => (
  <ModulePage
    title="Reports"
    table="bp_customer_ledger"
    description="Export-friendly operations reporting view (ledger-focused). Extend with project/date/stage filters as needed."
    columns={[
      { key: 'customer_id', label: 'Customer' },
      { key: 'booking_id', label: 'Booking' },
      { key: 'entry_type', label: 'Entry Type' },
      { key: 'amount', label: 'Amount' },
      { key: 'balance_after', label: 'Balance After' },
      { key: 'entry_date', label: 'Entry Date' },
    ]}
  />
);

export default ReportsPage;
