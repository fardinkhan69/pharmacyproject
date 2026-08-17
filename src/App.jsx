import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MedicinesPage from './pages/MedicinesPage';
import CreateBillPage from './pages/CreateBillPage';
import BillHistoryPage from './pages/BillHistoryPage';
import BillDetailsPage from './pages/BillDetailsPage';
import AdminManagementPage from './pages/AdminManagementPage';

function AuthenticatedLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/dashboard"
            element={
              <AuthenticatedLayout>
                <DashboardPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/medicines"
            element={
              <AuthenticatedLayout>
                <MedicinesPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/bills/new"
            element={
              <AuthenticatedLayout>
                <CreateBillPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/bills/:id"
            element={
              <AuthenticatedLayout>
                <BillDetailsPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/bills"
            element={
              <AuthenticatedLayout>
                <BillHistoryPage />
              </AuthenticatedLayout>
            }
          />
          <Route
            path="/admins"
            element={
              <AuthenticatedLayout>
                <AdminManagementPage />
              </AuthenticatedLayout>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
