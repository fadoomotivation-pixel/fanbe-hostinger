import React from 'react';
import ModulePage from '../components/ModulePage';

const CommissionRulesPage = () => (
  <ModulePage
    title="Commission Rules"
    table="bp_commission_rules"
    description="Rule engine matrix for project + rank + stage payouts with min collection threshold support."
    columns={[
      { key: 'project_id', label: 'Project' },
      { key: 'broker_rank', label: 'Broker Rank' },
      { key: 'stage', label: 'Stage' },
      { key: 'commission_pct', label: 'Commission %' },
      { key: 'flat_amount', label: 'Flat Amount' },
      { key: 'min_collection_pct', label: 'Min Collection %' },
      { key: 'is_active', label: 'Active' },
    ]}
    defaultForm={{ project_id: '', broker_rank: '', stage: 'booking', commission_pct: '', flat_amount: '', min_collection_pct: '', is_active: 'true', notes: '' }}
  />
);

export default CommissionRulesPage;
