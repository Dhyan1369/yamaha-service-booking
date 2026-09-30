import { useState } from 'react';
import { ShieldCheck, Search, Calendar } from 'lucide-react';
import { useBookings } from '../hooks/useBookings';

export default function Admin() {
  const { updateStatus, getSlotStats } = useBookings();
  const [selectedDate, setSelectedDate] = useState('2026-09-30');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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

  const completedCount = dayBookings.filter((b) => b.status === 'Completed').length;
  const inServiceCount = dayBookings.filter((b) => b.status === 'In-Service').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-blue-500" /> Admin Service Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage real-time workshop queue, slot limits, and service updates</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-400" /> Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-3.5 py-2 outline-none focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Bookings Today</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-white">
              {stats.totalBooked} <span className="text-sm font-normal text-slate-500">/ {stats.maxDailySlots}</span>
            </p>
            <span className="text-xs font-bold text-blue-400">
              {Math.round((stats.totalBooked / stats.maxDailySlots) * 100)}%
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
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Free Service Quota</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-white">
              {stats.freeServices} <span className="text-sm font-normal text-slate-500">/ {stats.maxFreeServices}</span>
            </p>
            <span
              className={`text-xs font-bold ${
                stats.isFreeServiceFull ? 'text-red-400' : 'text-green-400'
              }`}
            >
              {stats.isFreeServiceFull ? 'Limit Reached' : `${stats.availableFreeSlots} Slots Left`}
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
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Completed / In-Service</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-3xl font-black text-green-400">
              {completedCount} <span className="text-sm font-normal text-amber-400">({inServiceCount} Active)</span>
            </p>
            <span className="text-xs font-bold text-slate-400">Workshop Progress</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            {stats.totalBooked - completedCount} pending completion for {selectedDate}
          </p>
        </div>
      </div>

      {/* Bookings Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-white text-base">Booked Service Queue</h3>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-mono font-semibold">
              {filteredBookings.length} Tokens
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search customer, phone, model..."
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
                <th className="px-6 py-3.5">Token</th>
                <th className="px-6 py-3.5">Time Slot</th>
                <th className="px-6 py-3.5">Customer & Phone</th>
                <th className="px-6 py-3.5">Bike Model</th>
                <th className="px-6 py-3.5">Vehicle Plate</th>
                <th className="px-6 py-3.5">Service Type</th>
                <th className="px-6 py-3.5">Status Update</th>
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
                      className="bg-slate-950 border border-slate-700 text-xs rounded-lg px-2.5 py-1 text-white outline-none focus:border-blue-500"
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
                    No bookings found matching criteria for {selectedDate}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
