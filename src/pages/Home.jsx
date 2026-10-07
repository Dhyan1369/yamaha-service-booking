import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ChevronRight, Wrench, Sparkles, Award, Zap, Calendar, Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { useLanguage } from '../context/LanguageContext';
import { getNextOpenBookingDate } from '../services/bookingService';
import SlotSelector from '../components/booking/SlotSelector';

export default function Home() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { lang, t } = useLanguage();
  const { getSlotStats, refreshAvailability } = useBookings();
  const [showSlots, setShowSlots] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState(() => getNextOpenBookingDate());

  // Fetch server availability whenever selectedSlotDate changes or slots card is shown
  useEffect(() => {
    if (showSlots && selectedSlotDate) {
      refreshAvailability(selectedSlotDate);
    }
  }, [showSlots, selectedSlotDate, refreshAvailability]);

  const slotStats = getSlotStats(selectedSlotDate);

  const handleOpenBooking = () => {
    // If logged-in user is an Admin, redirect to Admin Workshop Dashboard
    if (user?.isAdmin) {
      navigate('/admin');
      return;
    }
    // If not registered/logged-in, prompt user to sign up / sign in with seamless redirect to booking
    if (!user) {
      openAuthModal('signup', '/booking');
      return;
    }
    navigate('/booking');
  };

  const handleViewSlots = () => {
    setShowSlots((prev) => !prev);
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
            දිනකට උපරිම ටෝකන් 12ක් පමණි (Free Service 5 | Full + Normal Service 7). ඔබේ වෙන්කරගැනීම දැන්ම සිදුකර වේලාව ඉතිරි කරගන්න.
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
              type="button"
              onClick={handleViewSlots}
              className={`w-full sm:w-auto px-6 py-4 border font-semibold text-base rounded-2xl transition flex items-center justify-center gap-2.5 ${
                showSlots
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
              }`}
            >
              <Calendar className="w-5 h-5 text-white" />
              {showSlots ? 'Hide Available Slots' : 'View Available Slots'}
            </button>
          </div>

          {/* Interactive Date & Slot Selector - Displayed when 'View Available Slots' is clicked */}
          {showSlots && (
            <div className="mt-8 max-w-2xl mx-auto bg-slate-900/95 border border-blue-500/30 p-6 sm:p-7 rounded-3xl shadow-2xl backdrop-blur-xl text-left transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    {t('booking.viewSlotsByDateTitle')}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t('booking.viewSlotsByDateSubtitle')}
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold font-mono">
                  {selectedSlotDate}
                </span>
              </div>

              {/* Service Date Selector with Calendar */}
              <div className="mt-5">
                <SlotSelector
                  selectedDate={selectedSlotDate}
                  onDateChange={(newDate) => setSelectedSlotDate(newDate)}
                  label={t('booking.selectDate')}
                  defaultOpen={true}
                  keepOpen={true}
                  inline={true}
                />
              </div>

              {/* Live Slot Status Breakdown for Selected Date */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Total Slots */}
                  <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {lang === 'si' ? 'මුළු වාර (Total)' : 'Total Slots'}
                    </p>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <p className="text-xl font-extrabold text-white">
                        {slotStats.availableSlots} <span className="text-xs font-normal text-slate-500">/ {slotStats.maxDailySlots}</span>
                      </p>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${slotStats.isDayFull ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {slotStats.isDayFull ? (lang === 'si' ? 'පිරී ඇත' : 'FULL') : (lang === 'si' ? `${slotStats.availableSlots}ක් ඇත` : `${slotStats.availableSlots} Left`)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {slotStats.totalBooked} booked so far
                    </p>
                  </div>

                  {/* Free Service Quota */}
                  <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {lang === 'si' ? 'Free Service (නොමිලේ)' : 'Free Service'}
                    </p>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <p className="text-xl font-extrabold text-blue-400">
                        {slotStats.availableFreeSlots} <span className="text-xs font-normal text-slate-500">/ {slotStats.maxFreeServices}</span>
                      </p>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${slotStats.isFreeServiceFull ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {slotStats.isFreeServiceFull ? (lang === 'si' ? 'පිරී ඇත' : 'FULL') : (lang === 'si' ? `${slotStats.availableFreeSlots}ක් ඇත` : `${slotStats.availableFreeSlots} Left`)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Max 5 per day quota
                    </p>
                  </div>

                  {/* Full + Normal Service Quota */}
                  <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {lang === 'si' ? 'Full & Normal Service' : 'Full & Normal'}
                    </p>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <p className="text-xl font-extrabold text-purple-400">
                        {slotStats.availableStandardSlots} <span className="text-xs font-normal text-slate-500">/ {slotStats.maxStandardServices}</span>
                      </p>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${slotStats.isStandardServiceFull ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {slotStats.isStandardServiceFull ? (lang === 'si' ? 'පිරී ඇත' : 'FULL') : (lang === 'si' ? `${slotStats.availableStandardSlots}ක් ඇත` : `${slotStats.availableStandardSlots} Left`)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Max 7 per day quota
                    </p>
                  </div>
                </div>

                {/* Date info & Book Now Action */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>
                      {lang === 'si'
                        ? `ඊළඟ ටෝකනය: #${String(slotStats.nextAvailableToken).padStart(2, '0')} (${slotStats.nextSlotTime})`
                        : `Next Estimated Token: #${String(slotStats.nextAvailableToken).padStart(2, '0')} (${slotStats.nextSlotTime})`}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={slotStats.isDayFull}
                    onClick={() => {
                      if (user?.isAdmin) {
                        navigate('/admin');
                      } else if (!user) {
                        openAuthModal('signup', '/booking');
                      } else {
                        navigate('/booking', { state: { selectedDate: selectedSlotDate } });
                      }
                    }}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                      slotStats.isDayFull
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 hover:-translate-y-0.5'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    {t('booking.bookForThisDate')}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
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

