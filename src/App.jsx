import { useState } from 'react';
import { 
  Bike, Calendar, Clock, Search, ShieldCheck, 
  ChevronRight, ChevronLeft, Wrench, Sparkles, LogOut, Check
} from 'lucide-react';

const MAX_DAILY_SLOTS = 12;
const MAX_FREE_SERVICES = 5;
const POYA_DATES = new Set([
  '2026-01-03', '2026-02-01', '2026-03-03', '2026-04-02', '2026-05-01',
  '2026-05-31', '2026-06-29', '2026-07-29', '2026-08-28', '2026-09-26',
  '2026-10-26', '2026-11-24', '2026-12-24'
]);
const HOLIDAY_DATES = new Set([
  '2026-01-15', '2026-02-04', '2026-04-13', '2026-04-14', '2026-05-01',
  '2026-12-25'
]);

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INITIAL_BOOKINGS = [
  { id: 'BK-101', tokenNo: 1, timeSlot: '08:30 AM', name: 'Kasun Perera', phone: '0771234567', nic: '951234567V', bikeModel: 'FZ-S V3', serviceType: 'Free Service', status: 'Completed', date: '2026-09-30' },
  { id: 'BK-102', tokenNo: 2, timeSlot: '09:15 AM', name: 'Nuwan Pradeep', phone: '0719876543', nic: '923456781V', bikeModel: 'MT-15', vehicleNo: 'ABC-1234', serviceType: 'Full Service', status: 'In-Service', date: '2026-09-30' },
  { id: 'BK-103', tokenNo: 3, timeSlot: '10:00 AM', name: 'Dilshan Silva', phone: '0765554433', nic: '992019283V', bikeModel: 'R15 V4', serviceType: 'Free Service', status: 'Pending', date: '2026-09-30' },
];

export default function App() {
  const [view, setView] = useState('customer'); // 'customer' or 'admin'
  const [user, setUser] = useState(null); // Logged in user details
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [latestBooking, setLatestBooking] = useState(null);

  // Data Store
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [selectedDate, setSelectedDate] = useState('2026-09-30');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 8, 1));

  // Customer Auth Form State
  const [authForm, setAuthForm] = useState({
    name: '',
    nic: '',
    bikeModel: 'Yamaha FZ-S',
    phone: ''
  });

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    bikeModel: 'Yamaha FZ-S',
    vehicleNo: '',
    serviceType: 'Free Service',
    date: '2026-09-30'
  });

  // Admin Filters
  const [adminSearch, setAdminSearch] = useState('');

  // Daily statistics for selected date
  const dayBookings = bookings.filter(b => b.date === selectedDate);
  const totalBookedToday = dayBookings.length;
  const freeServicesToday = dayBookings.filter(b => b.serviceType === 'Free Service').length;
  const isDayFull = totalBookedToday >= MAX_DAILY_SLOTS;
  const isFreeServiceFull = freeServicesToday >= MAX_FREE_SERVICES;
  const bookingDateBookings = bookings.filter((booking) => booking.date === bookingForm.date);
  const bookingDateFreeServices = bookingDateBookings.filter((booking) => booking.serviceType === 'Free Service').length;
  const isBookingDateFull = bookingDateBookings.length >= MAX_DAILY_SLOTS;
  const isBookingDateFreeServiceFull = bookingDateFreeServices >= MAX_FREE_SERVICES;
  const customerBookings = user ? bookings.filter((booking) => booking.phone === user.phone) : [];

  const getCalendarDays = () => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const offset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    return [
      ...Array(offset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1))
    ];
  };

  // Handle Standard Login
  const handleManualLogin = (e) => {
    e.preventDefault();
    if (!authForm.name || !authForm.phone || !authForm.nic) return;
    
    const loggedUser = {
      name: authForm.name,
      nic: authForm.nic,
      phone: authForm.phone,
      bikeModel: authForm.bikeModel,
      method: 'Manual Registration'
    };
    setUser(loggedUser);
    setShowAuthModal(false);

    // Pre-fill booking form
    setBookingForm(prev => ({
      ...prev,
      name: loggedUser.name,
      phone: loggedUser.phone,
      bikeModel: loggedUser.bikeModel
    }));
  };

  // Handle Google Sign-in Simulation
  const handleGoogleSignIn = () => {
    const googleUser = {
      name: 'Charith Fernando',
      nic: '984521098V',
      phone: '0778901234',
      bikeModel: 'Yamaha MT-15',
      method: 'Google Account'
    };
    setUser(googleUser);
    setShowAuthModal(false);

    setBookingForm(prev => ({
      ...prev,
      name: googleUser.name,
      phone: googleUser.phone,
      bikeModel: googleUser.bikeModel
    }));
  };

  // Open booking modal
  const handleOpenBooking = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowBookingModal(true);
  };

  // Generate Slot Time based on Token Number
  const calculateSlotTime = (token) => {
    const startHour = 8;
    const startMin = 30;
    const totalMinutes = (token - 1) * 45;
    const slotHour = Math.floor((startHour * 60 + startMin + totalMinutes) / 60);
    const slotMin = (startHour * 60 + startMin + totalMinutes) % 60;
    const ampm = slotHour >= 12 ? 'PM' : 'AM';
    const displayHour = slotHour > 12 ? slotHour - 12 : slotHour;
    return `${String(displayHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')} ${ampm}`;
  };

  // Handle Booking Submit
  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (isBookingDateFull) {
      alert("Samawenna! Ada dinayata tokens 12 ma awasan wela aththa.");
      return;
    }

    if (bookingForm.serviceType === 'Free Service' && isBookingDateFreeServiceFull) {
      alert("Ape free service quota eka (5) ada dinayata piri aththa. Karunakara Paid Service thoraganna ho wena dinayak thoranna.");
      return;
    }

    const nextTokenNo = bookingDateBookings.length + 1;
    const newBooking = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      tokenNo: nextTokenNo,
      timeSlot: calculateSlotTime(nextTokenNo),
      name: bookingForm.name,
      phone: bookingForm.phone,
      nic: user.nic || 'N/A',
      bikeModel: bookingForm.bikeModel,
      vehicleNo: bookingForm.vehicleNo,
      serviceType: bookingForm.serviceType,
      status: 'Pending',
      date: bookingForm.date
    };

    setBookings([newBooking, ...bookings]);
    setLatestBooking(newBooking);
    setShowBookingModal(false);
    setShowSuccessModal(true);
  };

  // Update Status in Admin
  const handleStatusChange = (id, newStatus) => {
    setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <Bike className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-wider text-white flex items-center gap-1.5">
                YAMAHA <span className="text-red-500">PRO</span> SERVICE
              </span>
              <p className="text-xs text-slate-400 font-medium">Authorized Technical Workshop</p>
            </div>
          </div>

          {/* Right Corner Buttons */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setView(view === 'customer' ? 'admin' : 'customer')}
              className="text-xs border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 rounded-lg font-semibold transition"
            >
              {view === 'customer' ? 'Admin Portal' : 'Customer View'}
            </button>

            {user ? (
              <div className="flex items-center space-x-3 bg-slate-800/70 border border-slate-700/60 rounded-xl px-3 py-1.5">
                <div className="text-right">
                  <p className="text-sm font-semibold text-white leading-tight">{user.name}</p>
                  <p className="text-[11px] text-blue-400 font-mono">{user.phone}</p>
                </div>
                <button 
                  onClick={() => setUser(null)}
                  title="Sign Out"
                  className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-md shadow-blue-600/30"
                >
                  Login / Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        {view === 'customer' ? (
          <div>
            {/* Hero Section */}
            <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-900 bg-gradient-to-b from-blue-950/20 via-slate-950 to-slate-950">
              <div className="max-w-4xl mx-auto px-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold mb-6">
                  <Sparkles className="w-3.5 h-3.5" /> Quick Booking & Real-Time Token Generation
                </div>

                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
                  Fast & Precision Care For Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-red-500">Yamaha Beast</span>
                </h1>

                <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                  දිනකට උපරිම ටෝකන් 12ක් පමණි. ඔබේ වෙන්කරගැනීම දැන්ම සිදුකර වේලාව ඉතිරි කරගන්න.
                </p>

                {/* Center Booking Action */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleOpenBooking}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                  >
                    <Wrench className="w-5 h-5" />
                    Book a Service Now
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Slot Status Alert Banner */}
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left">
                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Today's General Slots</p>
                      <p className="text-lg font-bold text-white">{totalBookedToday} / {MAX_DAILY_SLOTS} Filled</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${isDayFull ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {isDayFull ? 'FULL' : `${MAX_DAILY_SLOTS - totalBookedToday} Available`}
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold">Today's Free Services</p>
                      <p className="text-lg font-bold text-white">{freeServicesToday} / {MAX_FREE_SERVICES} Used</p>
                    </div>
                    <div className={`px-2.5 py-1 rounded-md text-xs font-bold ${isFreeServiceFull ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {isFreeServiceFull ? 'QUOTA FULL' : `${MAX_FREE_SERVICES - freeServicesToday} Left`}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {user && (
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-2">Customer Dashboard</p>
                    <h2 className="text-2xl font-bold text-white">ආයුබෝවන්, {user.name}</h2>
                    <p className="text-sm text-slate-400 mt-1">ඔබගේ service bookings සහ token තත්ත්වය</p>
                  </div>
                  <button onClick={handleOpenBooking} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition">
                    <Wrench className="w-4 h-4" /> Book a Service
                  </button>
                </div>
                {customerBookings.length ? (
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-sm text-left min-w-[680px]">
                      <thead className="bg-slate-900 text-xs uppercase text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Date</th><th className="px-4 py-3">Token</th><th className="px-4 py-3">Bike Model</th><th className="px-4 py-3">Vehicle No</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-950/60">
                        {customerBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-4 py-3 text-slate-300">{booking.date}</td>
                            <td className="px-4 py-3 font-bold text-white">#{String(booking.tokenNo).padStart(2, '0')} <span className="font-normal text-slate-400">{booking.timeSlot}</span></td>
                            <td className="px-4 py-3 text-slate-300">{booking.bikeModel}</td>
                            <td className="px-4 py-3 text-slate-300">{booking.vehicleNo || 'Not provided'}</td>
                            <td className="px-4 py-3 text-slate-300">{booking.serviceType}</td>
                            <td className="px-4 py-3"><span className="px-2 py-1 rounded bg-blue-500/10 text-blue-300 text-xs font-semibold">{booking.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-lg px-5 py-8 text-center text-sm text-slate-400">ඔබට තවම service booking නොමැත.</div>
                )}
              </section>
            )}
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-500" /> Admin Service Dashboard
                </h2>
                <p className="text-sm text-slate-400">Manage real-time customer queue and slots</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Dashboard Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Bookings Today</p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-3xl font-black text-white">{totalBookedToday} <span className="text-sm font-normal text-slate-500">/ 12</span></p>
                  <span className="text-xs font-bold text-blue-400">{Math.round((totalBookedToday / 12) * 100)}%</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Free Service Quota</p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-3xl font-black text-white">{freeServicesToday} <span className="text-sm font-normal text-slate-500">/ 5</span></p>
                  <span className={`text-xs font-bold ${isFreeServiceFull ? 'text-red-400' : 'text-green-400'}`}>
                    {isFreeServiceFull ? 'Limit Reached' : `${5 - freeServicesToday} Slots Left`}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Completed Services</p>
                <div className="flex items-baseline justify-between mt-2">
                  <p className="text-3xl font-black text-green-400">
                    {dayBookings.filter(b => b.status === 'Completed').length}
                  </p>
                  <span className="text-xs font-bold text-slate-400">Finished Today</span>
                </div>
              </div>
            </div>

            {/* Bookings Queue Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Booked Service Queue</h3>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search phone or model..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-4 py-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-3.5">Token</th>
                      <th className="px-6 py-3.5">Time</th>
                      <th className="px-6 py-3.5">Customer & Phone</th>
                      <th className="px-6 py-3.5">Bike Model</th>
                      <th className="px-6 py-3.5">Service Type</th>
                      <th className="px-6 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {dayBookings
                      .filter(b => b.phone.includes(adminSearch) || b.bikeModel.toLowerCase().includes(adminSearch.toLowerCase()))
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-6 py-4 font-mono font-bold text-blue-400">#{String(item.tokenNo).padStart(2, '0')}</td>
                          <td className="px-6 py-4 font-semibold text-white">{item.timeSlot}</td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-white">{item.name}</p>
                            <p className="text-xs text-slate-400">{item.phone}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-200">{item.bikeModel}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.serviceType === 'Free Service' 
                                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {item.serviceType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-white outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="In-Service">In-Service</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    {dayBookings.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-500 text-sm">
                          No bookings found for {selectedDate}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Auth / Sign-in Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Customer Sign-in</h3>
            <p className="text-xs text-slate-400 mb-6">Booking එකක් සිදුකිරීමට කරුණාකර ඔබගේ විස්තර ඇතුළත් කරන්න.</p>

            {/* Google Sign-in Option */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-100 font-semibold py-2.5 px-4 rounded-xl transition mb-6 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>

            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase">Or fill details</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kasun Kalhara"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">ID Card (NIC) Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 199512345678"
                  value={authForm.nic}
                  onChange={(e) => setAuthForm({ ...authForm, nic: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0771234567"
                  value={authForm.phone}
                  onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Bike Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yamaha FZ-S V3"
                  value={authForm.bikeModel}
                  onChange={(e) => setAuthForm({ ...authForm, bikeModel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-800 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-600/30"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto p-6 rounded-2xl shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2">Book Service Token</h3>
            <p className="text-xs text-slate-400 mb-6">Service slot එකක් වෙන්කරවා ගැනීමට විස්තර තහවුරු කරන්න.</p>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Bike Model</label>
                <input
                  type="text"
                  required
                  value={bookingForm.bikeModel}
                  onChange={(e) => setBookingForm({ ...bookingForm, bikeModel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Vehicle No</label>
                <input
                  type="text"
                  required
                  value={bookingForm.vehicleNo}
                  onChange={(e) => setBookingForm({ ...bookingForm, vehicleNo: e.target.value })}
                  placeholder="ABC-1234"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Select Service Type</label>
                <select
                  value={bookingForm.serviceType}
                  onChange={(e) => setBookingForm({ ...bookingForm, serviceType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                >
                  <option value="Free Service" disabled={isBookingDateFreeServiceFull}>
                    Free Service {isBookingDateFreeServiceFull ? '(Quota Reached - 5/5)' : `(${5 - bookingDateFreeServices} Slots Left)`}
                  </option>
                  <option value="Full Service">Full Service</option>
                  <option value="Normal Service">Normal Service</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Service Date</label>
                <div className="relative">
                  <button type="button" onClick={() => setCalendarOpen(!calendarOpen)} className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500">
                    <span>{bookingForm.date}</span><Calendar className="w-4 h-4 text-white" />
                  </button>
                  {calendarOpen && (
                    <div className="absolute z-20 top-full mt-2 left-0 right-0 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <button type="button" aria-label="Previous month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-md"><ChevronLeft className="w-4 h-4" /></button>
                        <p className="text-sm font-semibold text-white">{calendarMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })}</p>
                        <button type="button" aria-label="Next month" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-md"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-7 text-center text-[10px] text-slate-500 mb-2">
                        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => <span key={day}>{day}</span>)}
                      </div>
                      <div className="grid grid-cols-7 gap-y-1">
                        {getCalendarDays().map((date, index) => {
                          if (!date) return <span key={`empty-${index}`} />;
                          const dateKey = toDateKey(date);
                          const isMonday = date.getDay() === 1;
                          const isPoya = POYA_DATES.has(dateKey);
                          const isHoliday = HOLIDAY_DATES.has(dateKey);
                          const isSelected = bookingForm.date === dateKey;
                          return (
                            <button key={dateKey} type="button" onClick={() => { setBookingForm({ ...bookingForm, date: dateKey }); setCalendarOpen(false); }} className={`relative h-9 rounded-md text-xs ${isSelected ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'} ${isMonday && !isSelected ? 'bg-slate-800/70' : ''}`}>
                              {date.getDate()}
                              {(isPoya || isHoliday) && <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isPoya ? 'bg-amber-400' : 'bg-rose-400'}`} />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-x-3 gap-y-2 text-[10px] text-slate-400">
                        <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-slate-600" /> සඳුදා</span>
                        <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-amber-400" /> පෝය දිනය</span>
                        <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-rose-400" /> නිවාඩු දිනය</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-2.5 border border-slate-800 hover:bg-slate-800 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBookingDateFull}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-600/30"
                >
                  Confirm Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Token Receipt Modal */}
      {showSuccessModal && latestBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm p-6 rounded-3xl shadow-2xl text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-400">
              <Check className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white">Booking Confirmed!</h3>
            <p className="text-xs text-slate-400 mt-1">ඔබගේ Yamaha Service Slot එක වෙන් කරගන්නා ලදී.</p>

            {/* Generated Token Card */}
            <div className="my-6 bg-slate-950 border border-blue-500/30 rounded-2xl p-5 relative">
              <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Queue Token Number</p>
              <h2 className="text-5xl font-black text-white my-2 tracking-tight">#{String(latestBooking.tokenNo).padStart(2, '0')}</h2>
              
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Allocated Time: {latestBooking.timeSlot}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-900 text-left text-xs space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-semibold text-slate-200">{latestBooking.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bike Model:</span>
                  <span className="font-semibold text-slate-200">{latestBooking.bikeModel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vehicle No:</span>
                  <span className="font-semibold text-slate-200">{latestBooking.vehicleNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-semibold text-blue-400">{latestBooking.serviceType}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}