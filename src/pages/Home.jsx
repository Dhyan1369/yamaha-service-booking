import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ChevronRight, Wrench, Sparkles, Award, Zap
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSlotStats } = useBookings();

  // Today's stats
  const todayObj = new Date();
  const year = todayObj.getFullYear();
  const month = String(todayObj.getMonth() + 1).padStart(2, '0');
  const day = String(todayObj.getDate()).padStart(2, '0');
  const todayKey = `${year}-${month}-${day}`;

  const todayStats = getSlotStats(todayKey);

  const handleOpenBooking = () => {
    // If logged-in user is an Admin, redirect to Admin Workshop Dashboard
    if (user?.isAdmin) {
      navigate('/admin');
      return;
    }
    navigate('/booking');
  };

  const handleViewSlots = () => {
    // If logged-in user is an Admin, navigate directly to Admin Control
    if (user?.isAdmin) {
      navigate('/admin');
    } else {
      navigate('/booking');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-900 bg-gradient-to-b from-blue-950/25 via-slate-950 to-slate-950">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Quick Booking & Real-Time Token Generation
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Fast & Precision Care For Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-red-500">
              Yamaha Beast
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            දිනකට උපරිම ටෝකන් 12ක් පමණි. ඔබේ වෙන්කරගැනීම දැන්ම සිදුකර වේලාව ඉතිරි කරගන්න.
          </p>

          {/* Booking Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleOpenBooking}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
            >
              <Wrench className="w-5 h-5" />
              {user?.isAdmin ? 'Manage Admin Dashboard' : 'Book a Service Now'}
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleViewSlots}
              className="w-full sm:w-auto px-6 py-4 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-base rounded-2xl transition"
            >
              {user?.isAdmin ? 'View Admin Queue' : 'View Available Slots'}
            </button>
          </div>

          {/* Slot Status Alert Banner */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold">Today's General Slots</p>
                <p className="text-lg font-bold text-white">
                  {todayStats.totalBooked} / {todayStats.maxDailySlots} Filled
                </p>
              </div>
              <div
                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  todayStats.isDayFull
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-green-500/20 text-green-400'
                }`}
              >
                {todayStats.isDayFull ? 'FULL' : `${todayStats.availableSlots} Available`}
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold">Today's Free Services</p>
                <p className="text-lg font-bold text-white">
                  {todayStats.freeServices} / {todayStats.maxFreeServices} Used
                </p>
              </div>
              <div
                className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                  todayStats.isFreeServiceFull
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {todayStats.isFreeServiceFull ? 'QUOTA FULL' : `${todayStats.availableFreeSlots} Left`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Why Choose Manju Yamaha Service, Kamburupitiya?
          </h2>
          <p className="text-slate-400 text-sm mt-2">
            Specially trained technicians with certified diagnostic tools and genuine parts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Token Queue</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              No long queues or waiting lines. Book your exact 45-minute service window online with our daily token system.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center text-red-400 mb-4">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">100% Genuine Yamalube</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              We exclusively use factory-spec lubricants, genuine filters, and diagnostic firmware updates for peak performance.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition">
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center text-green-400 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Warranty Guaranteed</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              All services recorded officially with warranty retention. Full Free Service quotas managed automatically.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

