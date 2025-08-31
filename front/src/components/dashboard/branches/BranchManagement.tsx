import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { BranchesPage } from './BranchesPage';
import { CreateBranch } from './CreateBranch';
import { EditBranch } from './EditBranch';

export const BranchManagement: React.FC = () => {
  return (
    <Routes>
      <Route index element={<BranchesPage />} />
      <Route path="new" element={<CreateBranch />} />
      <Route path=":id/edit" element={<EditBranch />} />
      <Route path="*" element={<Navigate to="/dashboard/branches" replace />} />
    </Routes>
  );
};

export default BranchManagement;

