import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RouterList } from './RouterList';
import { RouterDetails } from './RouterDetails';
import { CreateRouter } from './CreateRouter';
import { EditRouter } from './EditRouter';

export const RouterManagement: React.FC = () => {
  return (
    <Routes>
      <Route index element={<RouterList />} />
      <Route path="create" element={<CreateRouter />} />
      <Route path=":id" element={<RouterDetails />} />
      <Route path=":id/edit" element={<EditRouter />} />
      <Route path="*" element={<Navigate to="/dashboard/routers" replace />} />
    </Routes>
  );
};