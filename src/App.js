import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AccessCodePage from './pages/AccessCodePage';
import CatalogPage from './pages/CatalogPage';
import { getTeamSession } from './utils/session';

function RequireTeam({ children }) {
  return getTeamSession() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AccessCodePage />} />
        <Route path="/catalog" element={<RequireTeam><CatalogPage /></RequireTeam>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
