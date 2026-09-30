import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const MAX_DAILY_SLOTS = 12;
export const MAX_FREE_SERVICES = 5;

export const POYA_DATES = new Set([
  '2026-01-03', '2026-02-01', '2026-03-03', '2026-04-02', '2026-05-01',
  '2026-05-31', '2026-06-29', '2026-07-29', '2026-08-28', '2026-09-26',
  '2026-10-26', '2026-11-24', '2026-12-24'
]);

export const HOLIDAY_DATES = new Set([
  '2026-01-15', '2026-02-04', '2026-04-13', '2026-04-14', '2026-05-01',
  '2026-12-25'
]);

export const INITIAL_BOOKINGS = [
  { id: 'BK-101', tokenNo: 1, timeSlot: '08:30 AM', name: 'Kasun Perera', phone: '0771234567', nic: '951234567V', bikeModel: 'FZ-S V3', vehicleNo: 'BAP-4521', serviceType: 'Free Service', status: 'Completed', date: '2026-09-30' },
  { id: 'BK-102', tokenNo: 2, timeSlot: '09:15 AM', name: 'Nuwan Pradeep', phone: '0719876543', nic: '923456781V', bikeModel: 'MT-15', vehicleNo: 'ABC-1234', serviceType: 'Full Service', status: 'In-Service', date: '2026-09-30' },
  { id: 'BK-103', tokenNo: 3, timeSlot: '10:00 AM', name: 'Dilshan Silva', phone: '0765554433', nic: '992019283V', bikeModel: 'R15 V4', vehicleNo: 'WP-BIK-9011', serviceType: 'Free Service', status: 'Pending', date: '2026-09-30' },
];

export const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateSlotTime = (token) => {
  const startHour = 8;
  const startMin = 30;
  const totalMinutes = (token - 1) * 45;
  const slotHour = Math.floor((startHour * 60 + startMin + totalMinutes) / 60);
  const slotMin = (startHour * 60 + startMin + totalMinutes) % 60;
  const ampm = slotHour >= 12 ? 'PM' : 'AM';
  const displayHour = slotHour > 12 ? slotHour - 12 : slotHour;
  return `${String(displayHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')} ${ampm}`;
};

const LOCAL_STORAGE_KEY = 'yamaha_bookings_store';

const getLocalBookings = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading bookings from localStorage:', err);
    return INITIAL_BOOKINGS;
  }
};

const saveLocalBookings = (bookings) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.error('Error saving bookings to localStorage:', err);
  }
};

export const bookingService = {
  async getBookings() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('tokenNo', { ascending: true });

      if (!error && data) return data;
      console.warn('Supabase fetch failed, falling back to local data:', error);
    }
    return getLocalBookings();
  },

  async createBooking(bookingData) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (!error && data) return data;
      console.warn('Supabase insert failed, storing locally:', error);
    }

    const current = getLocalBookings();
    const updated = [bookingData, ...current];
    saveLocalBookings(updated);
    return bookingData;
  },

  async updateBookingStatus(id, newStatus) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return data;
      console.warn('Supabase update failed, updating locally:', error);
    }

    const current = getLocalBookings();
    const updated = current.map((b) => (b.id === id ? { ...b, status: newStatus } : b));
    saveLocalBookings(updated);
    return { id, status: newStatus };
  }
};
