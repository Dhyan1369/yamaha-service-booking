import { Bike, Phone, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Summary */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center space-x-2 text-white">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-base tracking-wider">
                Manju <span className="text-red-500">Yamaha</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Authorized Yamaha service center in Kamburupitiya, specializing in high-precision two-wheeler maintenance and repair.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3">Quick Navigation</h4>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-blue-400 transition">Home</Link></li>
              <li><Link to="/booking" className="hover:text-blue-400 transition">Book a Service Slot</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-400 transition">Customer Dashboard</Link></li>
              <li><Link to="/admin" className="hover:text-blue-400 transition">Admin Portal</Link></li>
            </ul>
          </div>

          {/* Workshop Working Hours */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" /> Working Hours
            </h4>
            <ul className="space-y-1.5">
              <li>Monday – Saturday: 8:00 AM – 5:30 PM</li>
              <li>Sunday: 8:30 AM – 1:30 PM</li>
              <li className="text-amber-400/90 text-[11px] pt-1">
                * Poya and Mercantile holidays subject to special token schedules.
              </li>
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" /> Service Center
            </h4>
            <p className="mb-2">Kamburupitiya, Sri Lanka</p>
            <p className="flex items-center gap-1 text-slate-300 font-mono">
              <Phone className="w-3.5 h-3.5 text-blue-400" /> +94 11 234 5678 / +94 77 123 4567
            </p>
            <div className="mt-3 inline-flex items-center gap-1 text-green-400 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Genuine Yamaha Yamalube &amp; Parts
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} Manju Yamaha Service, Kamburupitiya. All rights reserved.</p>
          <p className="text-slate-500 text-[11px]">දිනකට උපරිම ටෝකන් 12ක් පමණි (General: 12, Free: 5)</p>
        </div>
      </div>
    </footer>
  );
}
