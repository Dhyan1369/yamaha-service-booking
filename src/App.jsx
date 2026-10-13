import { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import { useAuth } from './hooks/useAuth';

const Home = lazy(() => import('./pages/Home'));
const Booking = lazy(() => import('./pages/Booking'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ContactUs = lazy(() => import('./pages/ContactUs'));

function ProtectedAdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user || (!user.isAdmin && user.role !== 'admin')) {
    // If not logged in or not admin, redirect or prompt to login
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-surface border border-border rounded-2xl text-center space-y-4 shadow-lg">
        <h2 className="text-xl font-bold text-mainText">Access Denied</h2>
        <p className="text-sm text-mutedText">
          The Admin Portal is reserved for workshop managers. Please sign in with an Administrator account.
        </p>
        <Link
          to="/login"
          state={{ redirectTo: '/admin' }}
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition shadow-sm"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  return children;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Enforce dark class on <html> always — single premium dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-600 selection:text-white" style={{ background: 'var(--bg-page)', color: 'var(--text-body)' }}>
      {/* Top Header */}
      <Header onOpenSidebar={() => setSidebarOpen(true)} />

      {/* Mobile Drawer / Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Router */}
      <main className="flex-1">
        <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signin" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Navigate to="/register" replace />} />
            <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
}