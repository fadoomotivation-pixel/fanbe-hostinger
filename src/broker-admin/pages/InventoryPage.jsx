import React from 'react';
import ModulePage from '../components/ModulePage';

const InventoryPage = () => (
  <ModulePage
    title="Inventory / Plots"
    table="bp_plots"
    description="Plot inventory with operational filters, status control, and quick creation for individual records."
    columns={[
      { key: 'plot_no', label: 'Plot No' },
      { key: 'project_id', label: 'Project' },
      { key: 'size_sqyd', label: 'Size sqyd' },
      { key: 'category', label: 'Category' },
      { key: 'facing', label: 'Facing' },
      { key: 'plc_charges', label: 'PLC' },
      { key: 'is_corner', label: 'Corner' },
      { key: 'price_per_sqyd', label: 'Rate / sqyd' },
      { key: 'total_price', label: 'Total Price' },
      { key: 'status', label: 'Status' },
    ]}
    defaultForm={{ plot_no: '', project_id: '', size_sqyd: '', category: '', facing: '', price_per_sqyd: '', total_price: '', status: 'available', block: '', sector: '', plc_charges: '', is_corner: 'false' }}
  />
);

export default InventoryPage;
