import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UsersPage } from './UsersPage';
import { EditUser } from './EditUser';

export const UserManagement: React.FC = () => {
  return (
    <Routes>
      <Route index element={<UsersPage />} />
      <Route path=":id/edit" element={<EditUser />} />
      <Route path="*" element={<Navigate to="/dashboard/users" replace />} />
    </Routes>
  );
};

export default UserManagement;
