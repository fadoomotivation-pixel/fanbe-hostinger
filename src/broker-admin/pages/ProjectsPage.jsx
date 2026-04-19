import React from 'react';
import ModulePage from '../components/ModulePage';

const ProjectsPage = () => (
  <ModulePage
    title="Projects"
    table="bp_projects"
    description="CRUD-ready module for project setup, status management, RERA and media links, plus bulk plot import entry points."
    columns={[
      { key: 'name', label: 'Project' },
      { key: 'location', label: 'Location' },
      { key: 'status', label: 'Status' },
      { key: 'total_plots', label: 'Total Plots' },
      { key: 'price_per_sqyd', label: 'Rate / sqyd' },
      { key: 'rera_no', label: 'RERA' },
      { key: 'site_manager', label: 'Site Manager' },
    ]}
    defaultForm={{ name: '', location: '', status: 'active', total_plots: '', price_per_sqyd: '', rera_no: '', brochure_url: '', map_url: '', site_manager: '' }}
  />
);

export default ProjectsPage;
