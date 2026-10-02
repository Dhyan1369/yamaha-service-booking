import { useNavigate } from 'react-router-dom';
import { User, Bike, Phone, CreditCard, Wrench, Calendar } from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';

export default function UserDashboard() {
  const { user, openAuthModal } = useAuth();
  const { getUserBookings } = useBookings();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Customer Sign-in Required</h2>
        <p className="text-xs text-slate-400 mb-6">
          ඔබගේ service bookings සහ token තත්ත්වය බැලීමට කරුණාකර පළමුව Sign-in වන්න.
        </p>
        <Button variant="primary" size="md" onClick={openAuthModal}>
          Login / Sign In Now
        </Button>
      </div>
    );
  }

  // Immediately query bookings for logged-in user object (id, phone, nic)
  const customerBookings = getUserBookings(user);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'In-Service':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Cancelled':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Profile Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 font-black text-xl uppercase">
            {(user.name || 'C').charAt(0)}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-0.5">Customer Dashboard</p>
            <h1 className="text-2xl font-extrabold text-white">ආයුබෝවන්, {user.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-500" /> {user.phone}
                </span>
              )}
              {user.phone && user.nic && <span>•</span>}
              {user.nic && (
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" /> NIC: {user.nic}
                </span>
              )}
              {user.bikeModel && <span>•</span>}
              {user.bikeModel && (
                <span className="flex items-center gap-1">
                  <Bike className="w-3.5 h-3.5 text-slate-500" /> {user.bikeModel}
                </span>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Wrench}
          onClick={() => navigate('/booking')}
        >
          Book a Service
        </Button>
      </div>

      {/* Bookings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">My Service Tokens & History</h2>
          <span className="text-xs text-slate-400">{customerBookings.length} Bookings recorded</span>
        </div>

        {customerBookings.length > 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[680px]">
                <thead className="bg-slate-950 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Service Date</th>
                    <th className="px-5 py-3.5">Token & Time</th>
                    <th className="px-5 py-3.5">Bike Model</th>
                    <th className="px-5 py-3.5">Vehicle Plate</th>
                    <th className="px-5 py-3.5">Service Type</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 bg-slate-900">
                  {customerBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 text-slate-200 font-mono text-xs">{booking.date}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-400">
                            #{String(booking.tokenNo).padStart(2, '0')}
                          </span>
                          <span className="text-xs text-slate-400">({booking.timeSlot})</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-200 font-medium">
                        <div>{booking.bikeModel}</div>
                        {booking.mileage && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {booking.mileage} km
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-300 font-mono text-xs">
                        {booking.vehicleNo || 'Not specified'}
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                          {booking.serviceType}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border border-slate-800 bg-slate-900/50 rounded-2xl p-12 text-center text-slate-400 space-y-4">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <p className="font-bold text-white text-base">ඔබට තවම service booking නොමැත.</p>
              <p className="text-xs text-slate-400 mt-1">ඔබගේ ප්‍රථම සේවා වාරය වෙන්කරවා ගැනීමට පහත බොත්තම ඔබන්න.</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => navigate('/booking')}>
              Book Service Now
            </Button>
          </div>
        )}
      </div>

    </div>
  );
}
