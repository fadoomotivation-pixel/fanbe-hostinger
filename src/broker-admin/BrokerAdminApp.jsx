import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminAuthGuard from './components/AdminAuthGuard';
import AdminLayout from './layouts/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import InventoryPage from './pages/InventoryPage';
import BookingsPage from './pages/BookingsPage';
import CustomersPage from './pages/CustomersPage';
import BrokersPage from './pages/BrokersPage';
import PayoutQueuePage from './pages/PayoutQueuePage';
import CommissionRulesPage from './pages/CommissionRulesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

const BrokerAdminApp = () => (
  <AdminAuthGuard>
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="brokers" element={<BrokersPage />} />
        <Route path="payouts" element={<PayoutQueuePage />} />
        <Route path="commission-rules" element={<CommissionRulesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/broker/admin" replace />} />
    </Routes>
  </AdminAuthGuard>
);

export default BrokerAdminApp;
