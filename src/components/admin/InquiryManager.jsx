import { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Phone,
  CheckCircle2,
  Archive,
  Trash2,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  Bike,
  User,
  Filter,
  AlertCircle
} from 'lucide-react';
import Button from '../common/Button';
import { inquiryService } from '../../services/inquiryService';
import { useLanguage } from '../../context/LanguageContext';

export default function InquiryManager({ onNewCountChange }) {
  const { lang, t } = useLanguage();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all' | 'new' | 'replied' | 'archived'
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data = await inquiryService.getInquiries();
      setInquiries(data);
      const newCount = data.filter((i) => i.status === 'new').length;
      if (onNewCountChange) onNewCountChange(newCount);
    } catch (err) {
      console.error('[InquiryManager] Failed to load inquiries:', err);
      setErrorMsg(err.message || 'Failed to load inquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await inquiryService.updateStatus(id, newStatus);
      setInquiries((prev) => {
        const next = prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item));
        const newCount = next.filter((i) => i.status === 'new').length;
        if (onNewCountChange) onNewCountChange(newCount);
        return next;
      });
    } catch (err) {
      console.error('[InquiryManager] Status update error:', err);
      alert('Could not update status: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id, customerName) => {
    const confirmed = window.confirm(
      t('admin.confirmDeleteInquiry', `Are you sure you want to delete inquiry from "${customerName}"?`)
    );
    if (!confirmed) return;

    try {
      setUpdatingId(id);
      await inquiryService.deleteInquiry(id);
      setInquiries((prev) => {
        const next = prev.filter((item) => item.id !== id);
        const newCount = next.filter((i) => i.status === 'new').length;
        if (onNewCountChange) onNewCountChange(newCount);
        return next;
      });
    } catch (err) {
      console.error('[InquiryManager] Delete error:', err);
      alert('Failed to delete inquiry: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper for relative time formatting
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return lang === 'si' ? 'මීට සුළු මොහොතකට පෙර' : 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return lang === 'si' ? `විනාඩි ${diffMin}කට පෙර` : `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return lang === 'si' ? `පැය ${diffHour}කට පෙර` : `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays === 1) return lang === 'si' ? 'ඊයේ' : 'Yesterday';
    if (diffDays < 7) return lang === 'si' ? `දින ${diffDays}කට පෙර` : `${diffDays}d ago`;

    return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // WhatsApp link generator: 0760755111 -> 94760755111
  const getWhatsAppUrl = (phone, name) => {
    const raw = (phone || '').replace(/[\s-]/g, '');
    const cleanNumber = raw.startsWith('0') ? '94' + raw.slice(1) : raw.startsWith('+94') ? raw.slice(1) : raw;
    const greeting = lang === 'si'
      ? `ආයුබෝවන් ${name}, මංජු යමහා සේවා මධ්‍යස්ථානය (කඹුරුපිටිය) වෙත ඔබ යොමුකළ විමසීම සම්බන්ධයෙන්...`
      : `Hello ${name}, regarding your service inquiry at Manju Yamaha Service Center (Kamburupitiya)...`;
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(greeting)}`;
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const matchesFilter = filter === 'all' || inq.status === filter;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        (inq.name && inq.name.toLowerCase().includes(term)) ||
        (inq.phone && inq.phone.toLowerCase().includes(term)) ||
        (inq.bike_model && inq.bike_model.toLowerCase().includes(term)) ||
        (inq.message && inq.message.toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    });
  }, [inquiries, filter, searchTerm]);

  const counts = useMemo(() => {
    return {
      all: inquiries.length,
      new: inquiries.filter((i) => i.status === 'new').length,
      replied: inquiries.filter((i) => i.status === 'replied').length,
      archived: inquiries.filter((i) => i.status === 'archived').length
    };
  }, [inquiries]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Control Header & Filters */}
      <div className="bg-surface border border-border p-5 sm:p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-mainText flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brandBlue" />
              {t('admin.inquiriesTitle', 'Customer Inquiries & Feedback')}
            </h2>
            <p className="text-xs text-mutedText mt-0.5">
              {t('admin.inquiriesSubtitle', 'Direct customer messages from the contact page. Reach customers via phone or WhatsApp.')}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInquiries}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs min-h-[40px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{t('common.refresh', 'Refresh')}</span>
            </Button>
          </div>
        </div>

        {/* Filter Pills and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-border/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition min-h-[38px] flex items-center gap-1.5 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-surfaceMuted text-mutedText hover:text-white border border-border'
              }`}
            >
              <span>{t('admin.filterAll', 'All')}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'all' ? 'bg-white/20 text-white' : 'bg-surface text-mutedText'}`}>
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('new')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition min-h-[38px] flex items-center gap-1.5 ${
                filter === 'new'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-surfaceMuted text-mutedText hover:text-white border border-border'
              }`}
            >
              <span>{t('admin.filterNew', 'New / Unread')}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'new' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400 font-bold'}`}>
                {counts.new}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('replied')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition min-h-[38px] flex items-center gap-1.5 ${
                filter === 'replied'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-surfaceMuted text-mutedText hover:text-white border border-border'
              }`}
            >
              <span>{t('admin.filterReplied', 'Replied')}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'replied' ? 'bg-white/20 text-white' : 'bg-surface text-mutedText'}`}>
                {counts.replied}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilter('archived')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition min-h-[38px] flex items-center gap-1.5 ${
                filter === 'archived'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-surfaceMuted text-mutedText hover:text-white border border-border'
              }`}
            >
              <span>{t('admin.filterArchived', 'Archived')}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filter === 'archived' ? 'bg-white/20 text-white' : 'bg-surface text-mutedText'}`}>
                {counts.archived}
              </span>
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-mutedText absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={lang === 'si' ? 'නම, දුරකථනය හෝ පණිවිඩය සොයන්න...' : 'Search name, phone, model...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surfaceMuted border border-border pl-9 pr-3 py-2 rounded-xl text-xs text-mainText outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Error Message if any */}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Inquiries Feed List */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <p className="text-xs text-mutedText">Loading customer inquiries...</p>
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="bg-surface border border-border p-12 rounded-2xl text-center space-y-3 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-brandBlue flex items-center justify-center mx-auto border border-blue-500/20">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-mainText">
            {t('admin.noInquiriesFound', 'No customer inquiries found.')}
          </h3>
          <p className="text-xs text-mutedText max-w-sm mx-auto">
            {searchTerm
              ? (lang === 'si' ? 'සොයන පදයට අදාළ විමසීම් හමු නොවීය.' : 'No inquiries matched your search criteria.')
              : t('admin.noInquiriesDesc', 'Any messages submitted from the public contact page will show up here.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInquiries.map((inquiry) => {
            const isUpdating = updatingId === inquiry.id;

            return (
              <div
                key={inquiry.id}
                className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-md transition hover:border-blue-500/30 space-y-4"
              >
                {/* Top Row: Customer Info & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-mainText flex items-center gap-1.5">
                        <User className="w-4 h-4 text-brandBlue" />
                        {inquiry.name}
                      </span>

                      {/* Bike model badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Bike className="w-3 h-3" />
                        {inquiry.bike_model || 'Yamaha Bike'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-mutedText flex-wrap">
                      <span className="font-mono font-medium text-slate-300">
                        {inquiry.phone}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTimeAgo(inquiry.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {inquiry.status === 'new' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        {t('admin.filterNew', 'New / Unread')}
                      </span>
                    )}

                    {inquiry.status === 'replied' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('admin.filterReplied', 'Replied')}
                      </span>
                    )}

                    {inquiry.status === 'archived' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5" />
                        {t('admin.filterArchived', 'Archived')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <div
                  className="p-4 rounded-xl text-sm text-mainText font-normal leading-relaxed whitespace-pre-wrap break-words border border-border/40"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  {inquiry.message}
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
                  {/* Communication Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Call Direct */}
                    <a
                      href={`tel:${inquiry.phone}`}
                      className="min-h-[44px] px-3.5 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 hover:text-blue-300 text-xs font-bold inline-flex items-center gap-2 transition"
                    >
                      <Phone className="w-4 h-4 text-blue-400" />
                      <span>{t('admin.callCustomer', 'Call')} ({inquiry.phone})</span>
                    </a>

                    {/* WhatsApp Direct Link */}
                    <a
                      href={getWhatsAppUrl(inquiry.phone, inquiry.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold inline-flex items-center gap-2 transition"
                    >
                      <ExternalLink className="w-4 h-4 text-emerald-400" />
                      <span>{t('admin.directWhatsApp', 'WhatsApp')}</span>
                    </a>
                  </div>

                  {/* Status Switching and Delete Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    {inquiry.status !== 'replied' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(inquiry.id, 'replied')}
                        className="min-h-[44px] px-3 rounded-xl bg-surfaceMuted hover:bg-emerald-600/20 text-mutedText hover:text-emerald-300 border border-border hover:border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                        title={t('admin.markAsReplied', 'Mark as Replied')}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t('admin.markAsReplied', 'Mark Replied')}</span>
                      </button>
                    )}

                    {inquiry.status !== 'archived' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(inquiry.id, 'archived')}
                        className="min-h-[44px] px-3 rounded-xl bg-surfaceMuted hover:bg-muted text-mutedText hover:text-white border border-border text-xs font-semibold transition flex items-center gap-1.5"
                        title={t('admin.markAsArchived', 'Archive')}
                      >
                        <Archive className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t('admin.markAsArchived', 'Archive')}</span>
                      </button>
                    )}

                    {inquiry.status !== 'new' && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(inquiry.id, 'new')}
                        className="min-h-[44px] px-3 rounded-xl bg-surfaceMuted hover:bg-amber-600/20 text-mutedText hover:text-amber-300 border border-border hover:border-amber-500/30 text-xs font-semibold transition flex items-center gap-1.5"
                        title={t('admin.markAsNew', 'Mark as New')}
                      >
                        <span>{t('admin.markAsNew', 'Set New')}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleDelete(inquiry.id, inquiry.name)}
                      className="min-h-[44px] w-10 flex items-center justify-center rounded-xl bg-surfaceMuted hover:bg-red-600/20 text-mutedText hover:text-red-400 border border-border hover:border-red-500/30 transition"
                      title={t('admin.deleteInquiry', 'Delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
