import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ClientList } from './ClientList';
import { ClientDetails } from './ClientDetails';
import { CreateClient } from './CreateClient';
import { EditClient } from './EditClient';

export const ClientManagement: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ClientList />} />
      <Route path="create" element={<CreateClient />} />
      <Route path=":id" element={<ClientDetails />} />
      <Route path=":id/edit" element={<EditClient />} />
      <Route path="*" element={<Navigate to="/dashboard/clients" replace />} />
    </Routes>
  );
};