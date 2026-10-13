import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  MessageCircle,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  Bike,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  X,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { customerService, normalizePhone } from '../../services/customerService';
import { useLanguage } from '../../context/LanguageContext';

export default function CustomerDirectory() {
  const { lang, t } = useLanguage();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Selected customer for View Detail Modal
  const [viewCustomer, setViewCustomer] = useState(null);
  const [viewDetails, setViewDetails] = useState({ vehicles: [], bookings: [] });
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Selected customer for Edit Modal
  const [editCustomer, setEditCustomer] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', adminNotes: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Selected customer for Deactivate / Reactivate Confirmation Modal
  const [confirmToggleCustomer, setConfirmToggleCustomer] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Fetch all customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('[CustomerDirectory] Failed to load customers:', err);
      setErrorMsg(err.message || 'Failed to load customer directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return customers.filter((c) => {
      // 1. Status Filter
      if (statusFilter === 'active' && !c.isActive) return false;
      if (statusFilter === 'inactive' && c.isActive) return false;

      // 2. Search Query (Name, Phone, Plate, or Bike Model)
      if (!q) return true;
      const matchName = c.name?.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      const matchPlates = c.vehiclePlates?.some((p) => p.toLowerCase().includes(q));
      const matchModels = c.vehicleModels?.some((m) => m.toLowerCase().includes(q));
      const matchNotes = c.adminNotes?.toLowerCase().includes(q);

      return matchName || matchPhone || matchPlates || matchModels || matchNotes;
    });
  }, [customers, searchTerm, statusFilter]);

  // Statistics counters
  const totalCount = customers.length;
  const activeCount = customers.filter((c) => c.isActive).length;
  const inactiveCount = totalCount - activeCount;

  // View Customer Details
  const handleOpenView = async (customer) => {
    setViewCustomer(customer);
    try {
      setLoadingDetails(true);
      const details = await customerService.getCustomerDetails(customer.id, customer.phone);
      setViewDetails(details);
    } catch (err) {
      console.warn('[CustomerDirectory] Failed to load details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Edit Customer Modal
  const handleOpenEdit = (customer) => {
    setEditCustomer(customer);
    setEditForm({
      name: customer.name || '',
      phone: customer.phone || '',
      adminNotes: customer.adminNotes || ''
    });
    setEditError('');
  };

  // Save Edit Customer Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editCustomer) return;
    setEditError('');

    try {
      setEditSaving(true);
      const updated = await customerService.updateCustomer(editCustomer.id, {
        name: editForm.name,
        phone: editForm.phone,
        adminNotes: editForm.adminNotes
      });

      // Update state locally
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editCustomer.id
            ? {
                ...c,
                name: updated.name,
                phone: updated.phone,
                adminNotes: updated.adminNotes
              }
            : c
        )
      );

      // If view modal is open for this customer, update it as well
      if (viewCustomer && viewCustomer.id === editCustomer.id) {
        setViewCustomer((prev) => ({
          ...prev,
          name: updated.name,
          phone: updated.phone,
          adminNotes: updated.adminNotes
        }));
      }

      setEditCustomer(null);
      showToast(t('admin.customerUpdatedSuccess', 'Customer details updated successfully!'));
    } catch (err) {
      setEditError(err.message || 'Failed to update customer.');
    } finally {
      setEditSaving(false);
    }
  };

  // Toggle Active / Inactive Status
  const handleConfirmToggle = async () => {
    if (!confirmToggleCustomer) return;
    const target = confirmToggleCustomer;
    const nextStatus = !target.isActive;

    try {
      setToggleLoading(true);
      await customerService.toggleCustomerStatus(target.id, nextStatus);

      setCustomers((prev) =>
        prev.map((c) => (c.id === target.id ? { ...c, isActive: nextStatus } : c))
      );

      if (viewCustomer && viewCustomer.id === target.id) {
        setViewCustomer((prev) => ({ ...prev, isActive: nextStatus }));
      }

      setConfirmToggleCustomer(null);
      showToast(
        t('admin.customerStatusUpdated', 'Customer account status updated successfully.')
      );
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update account status.');
    } finally {
      setToggleLoading(false);
    }
  };

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  // WhatsApp link helper
  const getWhatsAppLink = (phone) => {
    let raw = (phone || '').replace(/[\s-]/g, '');
    if (raw.startsWith('0')) {
      raw = '94' + raw.slice(1);
    }
    return `https://wa.me/${raw}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast('')}
            className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-red-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & Stats Counter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Customers */}
        <div
          className="p-5 rounded-2xl border transition-all"
          style={{
            background: 'linear-gradient(145deg, rgba(13,22,41,0.9), rgba(8,12,24,0.95))',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <div className="flex items-center justify-between text-subText text-xs font-bold uppercase tracking-wider">
            <span>{t('admin.totalCustomers', 'Total Customers')}</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white mt-2">{totalCount}</p>
          <p className="text-[11px] text-mutedText mt-1">
            Registered riders & workshop clients
          </p>
        </div>

        {/* Active Customers */}
        <div
          className="p-5 rounded-2xl border transition-all"
          style={{
            background: 'linear-gradient(145deg, rgba(13,22,41,0.9), rgba(8,12,24,0.95))',
            borderColor: 'rgba(16,185,129,0.2)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>{t('admin.activeCustomers', 'Active')}</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <p className="text-3xl font-black text-emerald-400 mt-2">{activeCount}</p>
          <p className="text-[11px] text-mutedText mt-1">
            Full online booking privileges
          </p>
        </div>

        {/* Inactive / Deactivated */}
        <div
          className="p-5 rounded-2xl border transition-all"
          style={{
            background: 'linear-gradient(145deg, rgba(13,22,41,0.9), rgba(8,12,24,0.95))',
            borderColor: inactiveCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>{t('admin.inactiveCustomers', 'Inactive / Deactivated')}</span>
            <UserX className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-3xl font-black text-red-400 mt-2">{inactiveCount}</p>
          <p className="text-[11px] text-mutedText mt-1">
            Online booking barred (records kept)
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        className="p-4 sm:p-5 rounded-2xl border space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4"
        style={{
          background: 'rgba(13,21,37,0.85)',
          borderColor: 'rgba(255,255,255,0.07)'
        }}
      >
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-mutedText absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t(
              'admin.searchCustomerPlaceholder',
              'Search by customer name, phone (07X...), or vehicle plate...'
            )}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm bg-white/5 border border-white/10 text-white placeholder-slate-400 outline-none focus:border-blue-500 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter & Refresh Controls */}
        <div className="flex items-center gap-2">
          {/* Status Filter Pill Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-medium">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-subText hover:text-white'
              }`}
            >
              {t('admin.statusFilterAll', 'All')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white font-bold shadow'
                  : 'text-subText hover:text-white'
              }`}
            >
              {t('admin.statusFilterActive', 'Active')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'inactive'
                  ? 'bg-red-600 text-white font-bold shadow'
                  : 'text-subText hover:text-white'
              }`}
            >
              {t('admin.statusFilterInactive', 'Inactive')}
            </button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            loading={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs border-white/10"
            title="Refresh customer list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Directory Table / Cards View */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-mutedText">Loading customer directory...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div
          className="p-12 text-center rounded-2xl border space-y-3"
          style={{
            background: 'rgba(13,21,37,0.5)',
            borderColor: 'rgba(255,255,255,0.06)'
          }}
        >
          <Users className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {t('admin.noCustomersFound', 'No registered customers found matching your search.')}
          </h3>
          <p className="text-xs text-mutedText max-w-sm mx-auto">
            {searchTerm
              ? `No results for "${searchTerm}". Try searching by another keyword or reset filters.`
              : 'When customers register or walk-in service tokens are issued, their profiles will appear here.'}
          </p>
          {searchTerm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="mt-2 text-xs"
            >
              Reset Search & Filters
            </Button>
          )}
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(13,21,37,0.85)',
            borderColor: 'rgba(255,255,255,0.07)'
          }}
        >
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr
                  className="text-subText font-bold border-b border-white/10"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <th className="py-3.5 px-4 font-semibold">{t('admin.colCustomer', 'Customer')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('admin.colPhone', 'Phone & Contact')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('admin.colVehicles', 'Saved Bikes')}</th>
                  <th className="py-3.5 px-4 font-semibold text-center">{t('admin.colTotalBookings', 'Bookings')}</th>
                  <th className="py-3.5 px-4 font-semibold">{t('admin.colStatus', 'Status')}</th>
                  <th className="py-3.5 px-4 font-semibold text-right">{t('admin.colActions', 'Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-white/[0.02] transition-colors duration-150 group"
                  >
                    {/* Customer Name & Notes Preview */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                          style={{
                            background: cust.isActive
                              ? 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(30,58,138,0.4))'
                              : 'rgba(255,255,255,0.05)',
                            color: cust.isActive ? '#60a5fa' : '#94a3b8',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-blue-400 transition">
                              {cust.name || 'Unnamed Customer'}
                            </span>
                          </div>
                          {cust.adminNotes ? (
                            <p
                              className="text-[11px] text-amber-400/90 truncate max-w-[200px] flex items-center gap-1 mt-0.5"
                              title={cust.adminNotes}
                            >
                              <FileText className="w-3 h-3 shrink-0" />
                              <span>{cust.adminNotes}</span>
                            </p>
                          ) : (
                            <p className="text-[11px] text-mutedText mt-0.5 font-mono">
                              ID: {cust.id.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone & Direct Links */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-slate-200">
                          {cust.phone || 'No phone'}
                        </span>
                        {cust.phone && (
                          <div className="flex items-center gap-2 text-xs">
                            <a
                              href={`tel:${cust.phone}`}
                              className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
                              title="Call customer"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                            <span className="text-slate-600">•</span>
                            <a
                              href={getWhatsAppLink(cust.phone)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px]"
                              title="Open WhatsApp chat"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Saved Bikes */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-[220px]">
                        {cust.vehicleModels && cust.vehicleModels.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {cust.vehicleModels.slice(0, 2).map((m, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white/5 border border-white/10 text-slate-200"
                              >
                                <Bike className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                                <span className="truncate max-w-[120px]">{m}</span>
                              </span>
                            ))}
                            {cust.vehicleModels.length > 2 && (
                              <span className="text-[10px] text-mutedText self-center">
                                +{cust.vehicleModels.length - 2} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-mutedText text-xs italic">
                            No bikes saved
                          </span>
                        )}

                        {cust.vehiclePlates && cust.vehiclePlates.length > 0 && (
                          <div className="text-[10px] font-mono text-mutedText truncate">
                            {cust.vehiclePlates.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Total Bookings */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          cust.totalBookings > 0
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                            : 'bg-white/5 text-mutedText'
                        }`}
                      >
                        {cust.totalBookings}
                      </span>
                    </td>

                    {/* Active Status Badge */}
                    <td className="py-3.5 px-4">
                      {cust.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{t('admin.badgeActive', 'Active')}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <span>{t('admin.badgeInactive', 'Inactive')}</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenView(cust)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
                          title={t('admin.actionView', 'View Profile & History')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cust)}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-blue-400 hover:bg-blue-500/10 transition"
                          title={t('admin.actionEdit', 'Edit Customer')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Toggle Status Button */}
                        <button
                          type="button"
                          onClick={() => setConfirmToggleCustomer(cust)}
                          className={`p-1.5 rounded-lg transition ${
                            cust.isActive
                              ? 'text-slate-300 hover:text-red-400 hover:bg-red-500/10'
                              : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={
                            cust.isActive
                              ? t('admin.actionDeactivate', 'Deactivate Account')
                              : t('admin.actionReactivate', 'Reactivate Account')
                          }
                        >
                          {cust.isActive ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout (< lg) */}
          <div className="lg:hidden divide-y divide-white/5">
            {filteredCustomers.map((cust) => (
              <div key={cust.id} className="p-4 space-y-3.5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                      style={{
                        background: cust.isActive
                          ? 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(30,58,138,0.4))'
                          : 'rgba(255,255,255,0.05)',
                        color: cust.isActive ? '#60a5fa' : '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {cust.name || 'Unnamed Customer'}
                      </h4>
                      <p className="font-mono text-xs text-blue-400 font-semibold">
                        {cust.phone}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {cust.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      Inactive
                    </span>
                  )}
                </div>

                {/* Notes preview if any */}
                {cust.adminNotes && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{cust.adminNotes}</span>
                  </div>
                )}

                {/* Bike Models & Booking Count */}
                <div className="flex items-center justify-between text-xs text-subText pt-1">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <Bike className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">
                      {cust.vehicleModels?.length > 0
                        ? cust.vehicleModels.join(', ')
                        : 'No bikes registered'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-white px-2 py-0.5 rounded-md bg-white/10 shrink-0">
                    {cust.totalBookings} Bookings
                  </span>
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 gap-2">
                  <div className="flex items-center gap-3 text-xs">
                    <a
                      href={`tel:${cust.phone}`}
                      className="text-blue-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    <a
                      href={getWhatsAppLink(cust.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenView(cust)}
                      className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 text-xs flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cust)}
                      className="p-1.5 rounded-lg text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 text-xs flex items-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmToggleCustomer(cust)}
                      className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                        cust.isActive
                          ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                          : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                      }`}
                    >
                      {cust.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 1. CUSTOMER DETAIL MODAL (VIEW) ─────────────────────────────────── */}
      {viewCustomer && (
        <Modal
          isOpen={Boolean(viewCustomer)}
          onClose={() => setViewCustomer(null)}
          title={t('admin.customerDetailTitle', 'Customer Profile & Service History')}
          subtitle={t('admin.customerDetailSubtitle', 'Comprehensive overview of rider, garage motorcycles, and historical service tokens.')}
        >
          <div className="space-y-6 pt-2">
            {/* Header Identity Card */}
            <div
              className="p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.08)'
              }}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg"
                  style={{
                    background: viewCustomer.isActive
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                      : '#475569',
                    color: '#ffffff'
                  }}
                >
                  {viewCustomer.name ? viewCustomer.name.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{viewCustomer.name}</h3>
                    {viewCustomer.isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-sm text-blue-400 font-bold mt-0.5">
                    {viewCustomer.phone}
                  </p>
                </div>
              </div>

              {/* Quick Contact Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${viewCustomer.phone}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Rider</span>
                </a>
                <a
                  href={getWhatsAppLink(viewCustomer.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Admin Notes Box */}
            {viewCustomer.adminNotes && (
              <div
                className="p-4 rounded-xl border space-y-1"
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderColor: 'rgba(245, 158, 11, 0.25)'
                }}
              >
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('admin.adminNotesLabel', 'Admin Internal Notes')}</span>
                </span>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  {viewCustomer.adminNotes}
                </p>
              </div>
            )}

            {/* Section 1: Garage Motorcycles */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2">
                <Bike className="w-4 h-4 text-blue-400" />
                <span>{t('admin.garageBikes', 'Garage Motorcycles')}</span>
              </h4>

              {loadingDetails ? (
                <div className="py-6 text-center text-xs text-mutedText">Loading vehicles...</div>
              ) : viewDetails.vehicles.length === 0 && viewCustomer.vehicleModels?.length === 0 ? (
                <p className="text-xs text-mutedText italic p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  {t('admin.noGarageBikes', 'No motorcycles currently registered in garage.')}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(viewDetails.vehicles.length > 0
                    ? viewDetails.vehicles
                    : (viewCustomer.vehicleModels || []).map((m, i) => ({
                        id: i,
                        bikeModel: m,
                        vehiclePlate: (viewCustomer.vehiclePlates || [])[i] || '',
                        isDefault: i === 0
                      }))
                  ).map((v, idx) => (
                    <div
                      key={v.id || idx}
                      className="p-3 rounded-xl border flex items-center justify-between"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderColor: 'rgba(255,255,255,0.08)'
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <Bike className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-white">{v.bikeModel}</p>
                          <p className="text-[11px] font-mono text-mutedText mt-0.5">
                            {v.vehiclePlate || 'Plate not specified'}
                          </p>
                        </div>
                      </div>
                      {v.isDefault && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300">
                          Default
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 2: Complete Service History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-subText flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>
                  {t('admin.serviceHistory', 'Service History')} ({viewDetails.bookings.length})
                </span>
              </h4>

              {loadingDetails ? (
                <div className="py-6 text-center text-xs text-mutedText">Loading service records...</div>
              ) : viewDetails.bookings.length === 0 ? (
                <p className="text-xs text-mutedText italic p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  {t('admin.noServiceHistory', 'No past service bookings found for this customer.')}
                </p>
              ) : (
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                    {viewDetails.bookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-white/[0.02]"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{b.date}</span>
                            <span className="font-mono text-blue-400 font-bold">
                              Token #{b.tokenNo}
                            </span>
                            <span className="text-mutedText">({b.time})</span>
                          </div>
                          <p className="text-[11px] text-mutedText">
                            {b.bikeModel} {b.vehicleNo ? `• ${b.vehicleNo}` : ''}{' '}
                            {b.mileage ? `• ${b.mileage} km` : ''}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'Completed'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : b.status === 'In-Service'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : b.status === 'Cancelled'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {b.status}
                          </span>
                          <p className="text-[10px] text-mutedText mt-0.5">{b.serviceType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const target = viewCustomer;
                  setViewCustomer(null);
                  handleOpenEdit(target);
                }}
                className="flex items-center gap-1.5 text-xs text-blue-400 border-blue-500/30"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{t('admin.actionEdit', 'Edit Customer')}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewCustomer(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 2. EDIT CUSTOMER MODAL ───────────────────────────────────────────── */}
      {editCustomer && (
        <Modal
          isOpen={Boolean(editCustomer)}
          onClose={() => setEditCustomer(null)}
          title={t('admin.editCustomerTitle', 'Edit Customer Information')}
          subtitle={t('admin.editCustomerSubtitle', 'Update rider profile details and internal workshop notes.')}
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            {editError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <Input
              label={t('admin.fullNameLabel', 'Customer Full Name')}
              required
              placeholder="e.g. Kasun Kalhara"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />

            <Input
              label={t('admin.phoneLabel', 'Mobile Phone Number (10 Digits)')}
              required
              type="tel"
              placeholder="0771234567"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              helperText="Strict 10-digit format (0XXXXXXXXX, no +94)"
            />

            <div>
              <label className="block text-xs font-semibold text-subText mb-1.5">
                {t('admin.adminNotesLabel', 'Admin Internal Notes')}
              </label>
              <textarea
                rows={3}
                placeholder={t(
                  'admin.adminNotesPlaceholder',
                  'Add internal workshop notes about this customer (e.g. VIP client, preferred lube, payment terms, complaint history)...'
                )}
                value={editForm.adminNotes}
                onChange={(e) => setEditForm({ ...editForm, adminNotes: e.target.value })}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs sm:text-sm bg-white/5 border border-white/10 text-white placeholder-slate-400 outline-none focus:border-blue-500 transition resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setEditCustomer(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={editSaving}
                className="text-xs font-bold px-6"
              >
                {editSaving
                  ? t('admin.savingCustomer', 'Saving Changes...')
                  : t('admin.saveCustomerBtn', 'Save Changes')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── 3. DEACTIVATE / REACTIVATE CONFIRMATION MODAL ─────────────────────── */}
      {confirmToggleCustomer && (
        <Modal
          isOpen={Boolean(confirmToggleCustomer)}
          onClose={() => setConfirmToggleCustomer(null)}
          title={
            confirmToggleCustomer.isActive
              ? t('admin.deactivateConfirmTitle', 'Deactivate Customer Account')
              : t('admin.reactivateConfirmTitle', 'Reactivate Customer Account')
          }
        >
          <div className="space-y-4 pt-2">
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                confirmToggleCustomer.isActive
                  ? 'bg-red-500/10 border-red-500/25 text-red-300'
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
              }`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-sm text-white">
                  {confirmToggleCustomer.isActive ? 'Confirm Deactivation' : 'Confirm Reactivation'}
                </p>
                <p className="leading-relaxed">
                  {confirmToggleCustomer.isActive
                    ? t(
                        'admin.deactivateConfirmMsg',
                        'Are you sure you want to deactivate {name}? Their service records will remain fully intact, but they will be prevented from placing new online service bookings.'
                      ).replace('{name}', confirmToggleCustomer.name || confirmToggleCustomer.phone)
                    : t(
                        'admin.reactivateConfirmMsg',
                        'Reactivate {name}\'s account to restore online service booking access?'
                      ).replace('{name}', confirmToggleCustomer.name || confirmToggleCustomer.phone)}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-subText space-y-1 font-mono">
              <p>
                <strong className="text-white">Customer:</strong> {confirmToggleCustomer.name}
              </p>
              <p>
                <strong className="text-white">Phone:</strong> {confirmToggleCustomer.phone}
              </p>
              <p>
                <strong className="text-white">Total Records:</strong> {confirmToggleCustomer.totalBookings} past appointments
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setConfirmToggleCustomer(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant={confirmToggleCustomer.isActive ? 'danger' : 'primary'}
                size="md"
                loading={toggleLoading}
                onClick={handleConfirmToggle}
                className="text-xs font-bold px-5"
              >
                {confirmToggleCustomer.isActive
                  ? t('admin.confirmDeactivateBtn', 'Yes, Deactivate Account')
                  : t('admin.confirmReactivateBtn', 'Yes, Reactivate Account')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
