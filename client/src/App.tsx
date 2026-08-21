import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import DashboardLayout, { freelancerLinks, clientLinks } from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ServicesPage from './pages/ServicesPage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import PostJobPage from './pages/PostJobPage';
import ProfilePage from './pages/ProfilePage';
import MessagesPage from './pages/MessagesPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import NotFoundPage from './pages/NotFoundPage';

import FreelancerDashboard from './pages/dashboard/FreelancerDashboard';
import FreelancerServicesPage from './pages/dashboard/FreelancerServicesPage';
import FreelancerBidsPage from './pages/dashboard/FreelancerBidsPage';
import FreelancerRecommendationsPage from './pages/dashboard/FreelancerRecommendationsPage';
import ClientDashboard from './pages/dashboard/ClientDashboard';
import ClientBidsPage from './pages/dashboard/ClientBidsPage';
import ClientPaymentsPage from './pages/dashboard/ClientPaymentsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="jobs/:id" element={<JobDetailPage />} />
            <Route path="users/:id" element={<ProfilePage />} />
            <Route path="payment/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
            <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="jobs/new" element={<ProtectedRoute roles={['CLIENT', 'ADMIN']}><PostJobPage /></ProtectedRoute>} />

            <Route path="dashboard/freelancer" element={<ProtectedRoute roles={['FREELANCER', 'ADMIN']}><DashboardLayout links={freelancerLinks} /></ProtectedRoute>}>
              <Route index element={<FreelancerDashboard />} />
              <Route path="services" element={<FreelancerServicesPage />} />
              <Route path="bids" element={<FreelancerBidsPage />} />
              <Route path="recommendations" element={<FreelancerRecommendationsPage />} />
            </Route>

            <Route path="dashboard/client" element={<ProtectedRoute roles={['CLIENT', 'ADMIN']}><DashboardLayout links={clientLinks} /></ProtectedRoute>}>
              <Route index element={<ClientDashboard />} />
              <Route path="bids" element={<ClientBidsPage />} />
              <Route path="payments" element={<ClientPaymentsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </AuthProvider>
  );
}
