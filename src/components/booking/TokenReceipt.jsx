import { Check, Clock, Calendar, Bike, User, ShieldCheck, Printer, Gauge, Wrench, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';

export default function TokenReceipt({ isOpen, onClose, booking }) {
  const { t } = useLanguage();

  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const isFreeService = booking.serviceType?.toLowerCase().includes('free');

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" bodyPadding="p-3 sm:p-4" showClose={true}>
      <div className="text-center pt-0.5">
        {/* Success Icon */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto mb-1 text-emerald-600 dark:text-emerald-400 shadow-2xs">
          <Check className="w-4.5 h-4.5 stroke-[2.5]" />
        </div>

        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
          {t('booking.receiptTitle')}
        </h3>
        <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('booking.receiptSubtitle')}
        </p>

        {/* Official Yamaha Token Voucher Card */}
        <div 
          id="printable-token-voucher"
          className="my-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md rounded-xl overflow-hidden text-left relative"
        >
          {/* Top Brand Banner */}
          <div className="bg-[#002f87] text-white px-3 py-1.5 flex items-center justify-between select-none">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="font-black text-[11px] tracking-wider uppercase">
                MANJU YAMAHA SERVICE
              </span>
            </div>
            <span className="text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded tracking-wider uppercase">
              KAMBURUPITIYA
            </span>
          </div>

          {/* Token Header Section */}
          <div className="py-2 px-3 text-center bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#002f87] dark:text-blue-400">
              {t('booking.dailyToken')}
            </p>
            <div className="my-0.5 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                #{String(booking.tokenNo).padStart(2, '0')}
              </span>
            </div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[11px] font-bold shadow-2xs">
              <Clock className="w-3 h-3 text-[#002f87] dark:text-blue-400" />
              <span>{t('booking.slotTime')}</span>
              <span className="text-[#002f87] dark:text-blue-400 font-mono font-black ml-0.5">
                {booking.timeSlot}
              </span>
            </div>
          </div>

          {/* Ticket Perforated Notch Divider */}
          <div className="relative flex items-center justify-between px-2 -my-2 z-10 select-none">
            <div className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 -ml-3.5 shadow-inner" />
            <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-full mx-2" />
            <div className="w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 -mr-3.5 shadow-inner" />
          </div>

          {/* Structured Key-Value Details */}
          <div className="p-2.5 sm:p-3 space-y-1 bg-white dark:bg-slate-900 text-xs">
            {/* Date */}
            <div className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{t('common.date')}</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-right text-xs">
                {booking.date}
              </span>
            </div>

            {/* Customer */}
            <div className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                <User className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{t('common.customer')}</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[190px] text-xs">
                {booking.name}
              </span>
            </div>

            {/* Bike Model */}
            <div className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                <Bike className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{t('common.bikeModel')}</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[190px] text-xs">
                {booking.bikeModel}
              </span>
            </div>

            {/* Vehicle Plate */}
            <div className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{t('common.vehiclePlate')}</span>
              </span>
              <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tracking-wider shadow-2xs">
                {booking.vehicleNo || 'N/A'}
              </span>
            </div>

            {/* Mileage (if provided) */}
            {booking.mileage ? (
              <div className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                  <Gauge className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{t('common.mileage')}</span>
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-right text-xs">
                  {booking.mileage} km
                </span>
              </div>
            ) : null}

            {/* Service Type */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                <Wrench className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{t('common.serviceType')}</span>
              </span>
              <span className={`font-bold text-[11px] px-2 py-0.5 rounded-full border ${
                isFreeService
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
              }`}>
                {booking.serviceType}
              </span>
            </div>
          </div>

          {/* Arrive Early Notice */}
          <div className="mx-2.5 sm:mx-3 mb-2 p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-1.5 text-[11px] text-blue-950 dark:text-blue-200">
            <AlertCircle className="w-3.5 h-3.5 text-[#002f87] dark:text-blue-400 shrink-0 mt-0.5" />
            <span className="leading-snug">
              {t('booking.receiptNotice', 'Please arrive 10 minutes prior to your slot time. Present this token at the service counter.')}
            </span>
          </div>

          {/* Voucher Footer */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t('booking.workshopName')} • 041 229 5678</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
            className="flex-1 font-bold py-2 text-xs sm:text-sm"
          >
            {t('booking.printReceipt')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Check}
            onClick={onClose}
            className="flex-1 font-bold py-2 text-xs sm:text-sm"
          >
            {t('booking.doneClose')}
          </Button>
        </div>
      </div>

      {/* Print Specific Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-token-voucher, #printable-token-voucher * {
            visibility: visible !important;
          }
          #printable-token-voucher {
            position: fixed !important;
            left: 50% !important;
            top: 40px !important;
            transform: translateX(-50%) !important;
            width: 420px !important;
            background: #ffffff !important;
            color: #0f172a !important;
            border: 2px solid #002f87 !important;
            box-shadow: none !important;
            z-index: 999999 !important;
          }
          #printable-token-voucher div {
            background-color: transparent !important;
          }
          #printable-token-voucher .bg-\\[\\#002f87\\] {
            background-color: #002f87 !important;
            color: #ffffff !important;
          }
          #printable-token-voucher .text-slate-900,
          #printable-token-voucher .dark\\:text-white {
            color: #0f172a !important;
          }
          #printable-token-voucher .text-slate-500,
          #printable-token-voucher .dark\\:text-slate-400 {
            color: #475569 !important;
          }
          #printable-token-voucher .border-slate-200,
          #printable-token-voucher .dark\\:border-slate-700,
          #printable-token-voucher .border-slate-100 {
            border-color: #cbd5e1 !important;
          }
        }
      `}</style>
    </Modal>
  );
}
