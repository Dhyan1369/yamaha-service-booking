import { Check, Clock, Calendar, Bike, User, ShieldCheck, Printer, Gauge } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function TokenReceipt({ isOpen, onClose, booking }) {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" showClose={true}>
      <div className="text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-400">
          <Check className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-white">Booking Confirmed!</h3>
        <p className="text-xs text-slate-400 mt-1">ඔබගේ Yamaha Service Slot එක වෙන් කරගන්නා ලදී.</p>

        {/* Token Card */}
        <div className="my-6 bg-slate-950 border border-blue-500/30 rounded-2xl p-5 relative shadow-inner text-left">
          <div className="text-center border-b border-slate-900 pb-3">
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">Daily Queue Token</p>
            <h2 className="text-5xl font-black text-white my-1 tracking-tight font-mono">
              #{String(booking.tokenNo).padStart(2, '0')}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold mt-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Slot Time: {booking.timeSlot}
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs text-slate-400">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date:</span>
              <span className="font-semibold text-white font-mono">{booking.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Customer:</span>
              <span className="font-semibold text-slate-200">{booking.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1"><Bike className="w-3.5 h-3.5" /> Model:</span>
              <span className="font-semibold text-slate-200">{booking.bikeModel}</span>
            </div>
            {booking.mileage && (
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" /> Mileage:</span>
                <span className="font-semibold text-slate-200 font-mono">{booking.mileage} km</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>Vehicle No:</span>
              <span className="font-semibold text-slate-200 font-mono">{booking.vehicleNo || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-900">
              <span>Service Type:</span>
              <span className="font-bold text-blue-400">{booking.serviceType}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-green-500" /> Manju Yamaha Service Workshop
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
            icon={Printer}
            onClick={handlePrint}
            className="flex-1"
          >
            Print
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Done & Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
