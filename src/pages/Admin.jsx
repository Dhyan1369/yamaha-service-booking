import { useState } from 'react';
import { ShieldCheck, Search, Calendar, PlusCircle, Wrench, User, Phone, Bike, CreditCard, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useBookings } from '../hooks/useBookings';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';

export default function Admin() {
  const { updateStatus, getSlotStats, addBooking } = useBookings();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState('');

  // Form state for Walk-In / Phone-in booking
  const [walkInForm, setWalkInForm] = useState({
    name: '',
    phone: '',
    nic: 'Walk-in',
    bikeModel: 'Yamaha FZ-S V3',
    vehicleNo: '',
    serviceType: 'Full Service'
  });

  const stats = getSlotStats(selectedDate);
  const dayBookings = stats.dayBookings;

  const filteredBookings = dayBookings.filter((b) => {
    const matchesSearch =
      b.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bikeModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.vehicleNo && b.vehicleNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id, newStatus) => {
    await updateStatus(id, newStatus);
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setWalkInError('');
    setWalkInSubmitting(true);

    if (stats.isDayFull) {
      setWalkInError(`Cannot book: Maximum 12 daily slots reached for ${selectedDate}.`);
      setWalkInSubmitting(false);
      return;
    }

    try {
      const nextTokenNo = stats.totalBooked + 1;
      const newBooking = {
        id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
        tokenNo: nextTokenNo,
        timeSlot: stats.nextSlotTime,
        name: walkInForm.name,
        phone: walkInForm.phone,
        nic: walkInForm.nic,
        bikeModel: walkInForm.bikeModel,
        vehicleNo: walkInForm.vehicleNo,
        serviceType: walkInForm.serviceType,
        status: 'Pending',
        date: selectedDate
      };

      await addBooking(newBooking);
      setShowWalkInModal(false);
      setWalkInForm({
        name: '',
        phone: '',
        nic: 'Walk-in',
        bikeModel: 'Yamaha FZ-S V3',
        vehicleNo: '',
        serviceType: 'Full Service'
      });
    } catch (err) {
      setWalkInError(err.message || 'Failed to create walk-in booking');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  const completedCount = dayBookings.filter((b) => b.status === 'Completed').length;
  const inServiceCount = dayBookings.filter((b) => b.status === 'In-Service').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-blue-500" /> Admin Workshop Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              STAFF PORTAL
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time queue monitoring, walk-in token generation, and service progress tracking
          </p>
        </div>

        {/* Date Selector & Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-sm outline-none font-mono"
            />
          </div>

          <Button
            variant="primary"
            onClick={() => setShowWalkInModal(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> + Walk-In Booking
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Tokens</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-white">
              {stats.totalBooked} <span className="text-sm font-normal text-slate-500">/ {stats.maxDailySlots}</span>
            </p>
            <span className="text-xs font-bold text-blue-400">
              {Math.round((stats.totalBooked / stats.maxDailySlots) * 100)}% Capacity
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${stats.isDayFull ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, (stats.totalBooked / stats.maxDailySlots) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Free Service Quota</span>
            <Wrench className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-white">
              {stats.freeServices} <span className="text-sm font-normal text-slate-500">/ {stats.maxFreeServices}</span>
            </p>
            <span
              className={`text-xs font-bold ${
                stats.isFreeServiceFull ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {stats.isFreeServiceFull ? 'Quota Full' : `${stats.availableFreeSlots} Left`}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full ${stats.isFreeServiceFull ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min(100, (stats.freeServices / stats.maxFreeServices) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Workshop Progress</span>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-green-400">
              {completedCount} <span className="text-sm font-normal text-amber-400">({inServiceCount} Active)</span>
            </p>
            <span className="text-xs font-bold text-slate-400">
              {stats.totalBooked > 0 ? Math.round((completedCount / stats.totalBooked) * 100) : 0}% Done
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            {stats.totalBooked - completedCount} bikes pending service for {selectedDate}
          </p>
        </div>
      </div>

      {/* Bookings Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white text-base">Service Tokens ({selectedDate})</h3>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-mono font-semibold">
              {filteredBookings.length} Total Tokens
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone, plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-xl pl-9 pr-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-2.5 py-2 text-white outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In-Service">In-Service</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 min-w-[720px]">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Token #</th>
                <th className="px-6 py-3.5">Time Slot</th>
                <th className="px-6 py-3.5">Customer & Phone</th>
                <th className="px-6 py-3.5">Bike Model</th>
                <th className="px-6 py-3.5">Plate No</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900">
              {filteredBookings.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 font-mono font-bold text-blue-400 text-base">
                    #{String(item.tokenNo).padStart(2, '0')}
                  </td>
                  <td className="px-6 py-4 font-semibold text-white text-xs">{item.timeSlot}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white leading-tight">{item.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{item.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-200">{item.bikeModel}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                    {item.vehicleNo || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.serviceType === 'Free Service'
                          ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.serviceType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className={`text-xs rounded-lg px-2.5 py-1 text-white outline-none border font-semibold ${
                        item.status === 'Completed'
                          ? 'bg-green-950 border-green-800 text-green-300'
                          : item.status === 'In-Service'
                          ? 'bg-amber-950 border-amber-800 text-amber-300'
                          : item.status === 'Cancelled'
                          ? 'bg-red-950 border-red-800 text-red-300'
                          : 'bg-slate-950 border-slate-700 text-slate-300'
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In-Service">In-Service</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-500 text-sm">
                    No service tokens found for {selectedDate}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walk-in Booking Modal */}
      <Modal
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        title="Issue Walk-In / Phone Token"
        subtitle={`Generate a token for ${selectedDate}`}
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-4">
          {walkInError && (
            <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{walkInError}</span>
            </div>
          )}

          <Input
            label="Customer Name"
            icon={User}
            required
            placeholder="e.g. Kasun Kalhara"
            value={walkInForm.name}
            onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })}
          />

          <Input
            label="Customer Phone"
            icon={Phone}
            type="tel"
            required
            placeholder="e.g. 0771234567"
            value={walkInForm.phone}
            onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })}
          />

          <Input
            label="Bike Model"
            icon={Bike}
            required
            placeholder="e.g. Yamaha FZ-S V3"
            value={walkInForm.bikeModel}
            onChange={(e) => setWalkInForm({ ...walkInForm, bikeModel: e.target.value })}
          />

          <Input
            label="Vehicle Plate Number"
            icon={CreditCard}
            required
            placeholder="e.g. BAP-4521"
            value={walkInForm.vehicleNo}
            onChange={(e) => setWalkInForm({ ...walkInForm, vehicleNo: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Service Type
            </label>
            <select
              value={walkInForm.serviceType}
              onChange={(e) => setWalkInForm({ ...walkInForm, serviceType: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="Full Service">Full Service</option>
              <option value="Free Service">Free Service</option>
              <option value="Normal Service">Normal Service</option>
            </select>
          </div>

          <div className="flex gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowWalkInModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={walkInSubmitting || stats.isDayFull}
              className="flex-1"
            >
              {walkInSubmitting ? 'Generating...' : 'Issue Token'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

