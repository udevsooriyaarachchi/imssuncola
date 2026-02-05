import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Inventory from './pages/Inventory';
import Invoices from './pages/Invoices';
import InvoiceEditor from './pages/InvoiceEditor';
import Team from './pages/Team';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Billing from './pages/Billing';
import { UserRole, UserPermissions } from './types';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.isActive) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">Your account is currently inactive. Please contact the administrator.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

// Component to check feature permissions
const RequirePermission: React.FC<{ permission: keyof UserPermissions; children: React.ReactNode }> = ({ permission, children }) => {
  const { user } = useAuth();
  
  if (!user) return null;
  
  // Superadmin has implicit access to everything
  if (user.role === UserRole.SUPERADMIN) {
    return <>{children}</>;
  }

  // Check specific granular permission
  if (user.permissions && user.permissions[permission]) {
    return <>{children}</>;
  }

  // Redirect to dashboard if access denied
  return <Navigate to="/" replace />;
};

// Superadmin Only Route (Billing)
const RequireSuperAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || user.role !== UserRole.SUPERADMIN) {
     return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DataProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              
              <Route path="inventory" element={
                <RequirePermission permission="inventory">
                  <Inventory />
                </RequirePermission>
              } />
              
              <Route path="orders" element={
                <RequirePermission permission="orders">
                  <Orders />
                </RequirePermission>
              } />
              
              <Route path="reports" element={
                 <RequirePermission permission="reports">
                   <Reports />
                 </RequirePermission>
              } />

              <Route path="billing" element={
                 <RequireSuperAdmin>
                   <Billing />
                 </RequireSuperAdmin>
              } />
              
              <Route path="invoices" element={
                <RequirePermission permission="invoices">
                  <Invoices />
                </RequirePermission>
              } />
              
              <Route path="invoices/new" element={
                <RequirePermission permission="invoices">
                  <InvoiceEditor />
                </RequirePermission>
              } />
              
              <Route path="invoices/edit/:id" element={
                <RequirePermission permission="invoices">
                  <InvoiceEditor />
                </RequirePermission>
              } />
              
              <Route path="team" element={
                <RequirePermission permission="team">
                  <Team />
                </RequirePermission>
              } />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </DataProvider>
    </AuthProvider>
  );
};

export default App;