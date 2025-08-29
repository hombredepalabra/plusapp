import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { UsersList } from './UsersList';
import { CreateUser } from './CreateUser';

export const UsersPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<UsersList />} />
      <Route path="new" element={<CreateUser />} />
    </Routes>
  );
};