import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import AuthModal from './components/common/AuthModal';
import { useAuth } from './hooks/useAuth';
import { LanguageProvider } from './context/LanguageContext';

const Home = lazy(() => import('./pages/Home'));
const Booking = lazy(() => import('./pages/Booking'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));

function ProtectedAdminRoute({ children }) {
  const { user, loading, openAuthModal } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    // If not logged in or not admin, redirect to home page
    return (
      <div className="max-w-md mx-auto my-20 p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-slate-400">
          The Admin Portal is reserved for workshop managers. Please sign in with an Administrator account.
        </p>
        <button
          onClick={openAuthModal}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
        >
          Sign In as Admin
        </button>
      </div>
    );
  }

  return children;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showAuthModal, closeAuthModal } = useAuth();

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
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
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        {/* Global Auth Modal */}
        <AuthModal isOpen={showAuthModal} onClose={closeAuthModal} />

        {/* Bottom Footer */}
        <Footer />
      </div>
    </LanguageProvider>
  );
}