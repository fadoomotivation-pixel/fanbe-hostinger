import React from 'react';
import ModulePage from '../components/ModulePage';

const SettingsPage = () => (
  <div className="space-y-4">
    <ModulePage
      title="Settings"
      table="bp_settings"
      description="Application-level payout settings and operational flags."
      columns={[
        { key: 'key', label: 'Key' },
        { key: 'value', label: 'Value' },
        { key: 'updated_at', label: 'Updated At' },
      ]}
      defaultForm={{ key: '', value: '', notes: '' }}
    />
    <ModulePage
      title="Audit Log"
      table="bp_audit_log"
      description="Track approval actions, edits, and sensitive workflow events."
      columns={[
        { key: 'actor_id', label: 'Actor' },
        { key: 'entity_type', label: 'Entity' },
        { key: 'entity_id', label: 'Entity ID' },
        { key: 'action', label: 'Action' },
        { key: 'created_at', label: 'Created At' },
      ]}
    />
    <ModulePage
      title="Notifications"
      table="bp_notifications"
      description="Internal operations notifications and alert queue."
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Created At' },
      ]}
      defaultForm={{ title: '', message: '', type: 'info', status: 'unread' }}
    />
  </div>
);

export default SettingsPage;
