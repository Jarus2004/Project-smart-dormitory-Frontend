import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../../contexts/useAuth';
import { LoginPage } from '../../../modules/auth/pages/LoginPage';
import DashboardLayout from '../layouts/DashboardLayout';
import HomePage from '../../homepage/HomePage';

const UserIdentityFlowPage = lazy(() => import('../../../modules/face-verification/UserIdentityFlowPage'));
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage'));
const RoomManagementPage = lazy(() => import('../pages/RoomManagement/RoomManagementPage'));
const MaintenancePage = lazy(() => import('../pages/Maintenance/MaintenancePage'));
const StudentsPage = lazy(() => import('../pages/Students/StudentsPage'));
const AdminPanelPage = lazy(() => import('../pages/AdminPanel/AdminPanelPage'));
const AnalysisPage = lazy(() => import('../pages/Analysis/AnalysisPage'));
const MonitorPage = lazy(() => import('../pages/Monitor/MonitorPage'));
const TenantApplication = lazy(() => import('../../userPage/pages/TenantApplication'));
const StudentHome = lazy(() => import('../../userPage/pages/StudentHome'));
const StudentDocuments = lazy(() => import('../../userPage/pages/StudentDocuments'));
const StudentMaintenance = lazy(() => import('../../userPage/pages/StudentMaintenance'));
const StudentBilling = lazy(() => import('../../userPage/pages/StudentBillingBatch'));
const IncomeAndExpensesPage = lazy(() => import('../pages/Income-and-Expenses/IncomeAndExpensesPage'));
const VisitorsPage = lazy(() => import('../pages/Visitors/VisitorsPage'));
const VisitorRegistrationPage = lazy(() => import('../../../modules/visitor/VisitorRegistrationPage'));

const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ padding: 20, background: '#f6f8fa', minHeight: '100vh' }}>
      {children}
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Ensure role is ADMIN
  if (user.role !== 'ADMIN') {
    return <Navigate to="/student" replace />;
  }

  return <>{children}</>;
};

const StudentRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Ensure role is STUDENT
  if (user.role !== 'STUDENT') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>กำลังโหลดหน้าจอ...</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/visitor" element={<VisitorRegistrationPage />} />

          {/* Admin Routes */}
          <Route
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <DashboardLayout />
                </PageWrapper>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="room-management" element={<RoomManagementPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="access-control" element={<MonitorPage />} />
            <Route path="monitoring" element={<MonitorPage />} />
            <Route path="camera" element={<MonitorPage />} />
            <Route path="Monitor-monitoring" element={<MonitorPage />} />
            <Route path="admin-panel" element={<AdminPanelPage />} />
            <Route path="analysis" element={<AnalysisPage />} />
            <Route path="agreements" element={<Navigate to="/analysis" replace />} />
            <Route path="income-expenses" element={<IncomeAndExpensesPage />} />
            <Route path="visitors" element={<VisitorsPage />} />
          </Route>

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <StudentRoute>
                <PageWrapper>
                  <StudentHome />
                </PageWrapper>
              </StudentRoute>
            }
          />
          <Route
            path="/apply"
            element={
              <StudentRoute>
                <PageWrapper>
                  <TenantApplication />
                </PageWrapper>
              </StudentRoute>
            }
          />
          <Route
            path="/student/documents"
            element={
              <StudentRoute>
                <PageWrapper>
                  <StudentDocuments />
                </PageWrapper>
              </StudentRoute>
            }
          />
          <Route
            path="/student/maintenance"
            element={
              <StudentRoute>
                <PageWrapper>
                  <StudentMaintenance />
                </PageWrapper>
              </StudentRoute>
            }
          />
          <Route
            path="/student/billing"
            element={
              <StudentRoute>
                <PageWrapper>
                  <StudentBilling />
                </PageWrapper>
              </StudentRoute>
            }
          />
          <Route
            path="/user-identity-flow"
            element={
              <StudentRoute>
                <PageWrapper>
                  <UserIdentityFlowPage />
                </PageWrapper>
              </StudentRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
