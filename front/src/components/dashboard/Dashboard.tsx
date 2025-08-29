import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Overview } from './Overview';
import { ProfileSettings } from './ProfileSettings';
import { TwoFactorSettings } from './TwoFactorSettings';
import { RouterManagement } from './routers/RouterManagement';
import { ClientManagement } from './clients/ClientManagement';
import { SessionManagement } from '../sessions/SessionManagement';
import { FirewallManagement } from './firewall/FirewallManagement';
import { UserManagement } from './users/UserManagement';
import { SyncPage } from './sync/SyncPage';
import { BranchesPage } from './branches/BranchesPage';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="routers/*" element={<RouterManagement />} />
            <Route path="clients/*" element={<ClientManagement />} />
            <Route path="sessions/*" element={<SessionManagement />} />
            <Route path="firewall/*" element={<FirewallManagement />} />
            <Route path="users/*" element={<UserManagement />} />
            <Route path="sync/*" element={<SyncPage />} />
            <Route path="branches/*" element={<BranchesPage />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="security" element={<TwoFactorSettings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};