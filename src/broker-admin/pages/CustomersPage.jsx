import React from 'react';
import ModulePage from '../components/ModulePage';

const CustomersPage = () => (
  <ModulePage
    title="Customers"
    table="bp_customers"
    description="Customer profiles with identity fields, contact details, and linkage to booking/payment ledgers."
    columns={[
      { key: 'name', label: 'Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'pan', label: 'PAN' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
    ]}
    defaultForm={{ name: '', phone: '', alt_phone: '', email: '', aadhaar: '', pan: '', address: '', city: '', state: '', notes: '' }}
  />
);

export default CustomersPage;
