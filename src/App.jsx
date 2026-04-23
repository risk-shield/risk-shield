import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ThemeProvider from '@/lib/ThemeProvider';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import RiskRegister from '@/pages/RiskRegister';
import RiskMatrix from '@/pages/RiskMatrix';
import TreatmentPlans from '@/pages/TreatmentPlans';
import AuditLog from '@/pages/AuditLog';
import AgentHub from '@/pages/AgentHub';
import UserManagement from '@/pages/UserManagement';
import Settings from '@/pages/Settings';
import Pricing from '@/pages/Pricing';
import Installation from '@/pages/Installation';
import RiskFormPage from '@/pages/RiskFormPage';

const AuthenticatedApp = () => {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/register" element={<RiskRegister />} />
        <Route path="/matrix" element={<RiskMatrix />} />
        <Route path="/treatments" element={<TreatmentPlans />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/agents" element={<AgentHub />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/register/add" element={<RiskFormPage />} />
        <Route path="/register/edit/:id" element={<RiskFormPage />} />
      </Route>
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/installation" element={<Installation />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App