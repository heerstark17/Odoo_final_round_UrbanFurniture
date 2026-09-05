import { Routes, Route, Navigate } from 'react-router-dom';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
