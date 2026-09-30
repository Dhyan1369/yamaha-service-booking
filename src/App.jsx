import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import AuthModal from './components/common/AuthModal';
import Home from './pages/Home';
import Booking from './pages/Booking';
import UserDashboard from './pages/UserDashboard';
import Admin from './pages/Admin';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showAuthModal, closeAuthModal } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header onOpenSidebar={() => setSidebarOpen(true)} />

      {/* Mobile Drawer / Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Router */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={closeAuthModal} />

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
}