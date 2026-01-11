import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
const Login = React.lazy(() => import('./pages/Login'));
const Onboarding = React.lazy(() => import('./pages/Onboarding'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Routines = React.lazy(() => import('./pages/Routines'));
const Social = React.lazy(() => import('./pages/Social'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Profile = React.lazy(() => import('./pages/Profile'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));
const Nutrition = React.lazy(() => import('./pages/Nutrition'));
const Progress = React.lazy(() => import('./pages/Progress'));
const Upgrade = React.lazy(() => import('./pages/Upgrade'));
const PremiumPlans = React.lazy(() => import('./pages/PremiumPlans'));
const Tools = React.lazy(() => import('./pages/Tools'));
const TrainerOnboarding = React.lazy(() => import('./pages/TrainerOnboarding'));
const TrainerDashboard = React.lazy(() => import('./pages/TrainerDashboard'));
const StudentProgress = React.lazy(() => import('./pages/StudentProgress'));
const StoreAdmin = React.lazy(() => import('./pages/admin/StoreAdmin'));
const AdminLogin = React.lazy(() => import('./pages/admin/AdminLogin'));



import GlobalErrorBoundary from './components/GlobalErrorBoundary';

function App() {
  const { t } = useTranslation();

  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <GlobalErrorBoundary>
              <Suspense fallback={
                <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <p className="text-slate-400 font-medium animate-pulse">Cargando...</p>
                  </div>
                </div>
              }>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/routines" element={<Routines />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/community" element={<Social />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/user/:userId" element={<UserProfile />} />
                  <Route path="/nutrition" element={<Nutrition />} />
                  <Route path="/upgrade" element={<Upgrade />} />
                  <Route path="/premium" element={<PremiumPlans />} />
                  <Route path="/tools" element={<Tools />} />
                  <Route path="/become-trainer" element={<TrainerOnboarding />} />
                  <Route path="/trainer" element={<TrainerDashboard />} />
                  <Route path="/trainer/demo" element={<TrainerDashboard isDemo={true} />} />

                  {/* CRM Routes */}
                  <Route path="/crm/login" element={<AdminLogin />} />
                  <Route path="/crm/store" element={<StoreAdmin />} />
                  <Route path="/crm" element={<Navigate to="/crm/store" replace />} />

                  <Route path="/trainer/student/:studentId" element={<StudentProgress />} />
                  <Route path="/trainer/student/demo" element={<StudentProgress isDemo={true} />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Suspense>
            </GlobalErrorBoundary>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
