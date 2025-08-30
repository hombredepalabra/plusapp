import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UsersList } from './UsersList';
import { CreateUser } from './CreateUser';
import { EditUser } from './EditUser';

export const UserManagement: React.FC = () => {
  return (
    <Routes>
      <Route index element={<UsersList />} />
      <Route path="new" element={<CreateUser />} />
      <Route path=":id/edit" element={<EditUser />} />
      <Route path="*" element={<Navigate to="/dashboard/users" replace />} />
    </Routes>
  );
};

export default UserManagement;
