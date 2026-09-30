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

// Converts Supabase PostgreSQL snake_case columns to Frontend camelCase properties
const mapBookingFromDb = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    tokenNo: row.token_no ?? row.tokenNo,
    timeSlot: row.time_slot ?? row.timeSlot,
    name: row.name,
    phone: row.phone,
    nic: row.nic,
    bikeModel: row.bike_model ?? row.bikeModel,
    vehicleNo: row.vehicle_no ?? row.vehicleNo,
    serviceType: row.service_type ?? row.serviceType,
    status: row.status,
    date: row.date,
    userId: row.user_id ?? row.userId,
    createdAt: row.created_at ?? row.createdAt
  };
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
  async getBookings(dateFilter = null) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('bookings').select('*');
      if (dateFilter) {
        query = query.eq('date', dateFilter);
      }
      query = query.order('token_no', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Supabase fetch failed:', error);
        throw new Error(`Failed to load bookings from server: ${error.message}`);
      }
      return (data || []).map(mapBookingFromDb);
    }

    // Local storage fallback only when Supabase is unconfigured
    const local = getLocalBookings();
    return dateFilter ? local.filter(b => b.date === dateFilter) : local;
  },

  async createBooking(bookingData) {
    if (isSupabaseConfigured && supabase) {
      // 1. Try atomic creation via RPC (Transaction + Row locking)
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_booking_transaction', {
        p_date: bookingData.date,
        p_name: bookingData.name,
        p_phone: bookingData.phone,
        p_nic: bookingData.nic,
        p_bike_model: bookingData.bikeModel,
        p_vehicle_no: bookingData.vehicleNo,
        p_service_type: bookingData.serviceType,
        p_user_id: bookingData.userId || null
      });

      if (!rpcError && rpcData) {
        return mapBookingFromDb(rpcData);
      }

      // Check specific RPC failure error cases
      if (rpcError) {
        if (rpcError.message.includes('SLOT_FULL')) {
          throw new Error('Sorry, all 12 service slots for this date are already fully booked!');
        }
        // If RPC function isn't created yet in database, attempt fallback to table insert
        if (!rpcError.message.includes('function') && !rpcError.message.includes('does not exist')) {
          throw new Error(`Booking failed: ${rpcError.message}`);
        }
      }

      // 2. Direct table insertion if RPC is not yet deployed in database
      const dbRow = {
        date: bookingData.date,
        token_no: bookingData.tokenNo,
        time_slot: bookingData.timeSlot,
        name: bookingData.name,
        phone: bookingData.phone,
        nic: bookingData.nic,
        bike_model: bookingData.bikeModel,
        vehicle_no: bookingData.vehicleNo,
        service_type: bookingData.serviceType,
        status: bookingData.status || 'Pending',
        user_id: bookingData.userId || null
      };

      const { data: insertData, error: insertError } = await supabase
        .from('bookings')
        .insert([dbRow])
        .select()
        .single();

      if (!insertError && insertData) {
        return mapBookingFromDb(insertData);
      }

      if (insertError) {
        if (insertError.code === '23505') { // Postgres UNIQUE constraint violation
          throw new Error('Double booking prevented: This token or vehicle has already been booked for this date.');
        }
        throw new Error(`Server failed to save booking: ${insertError.message}`);
      }
    }

    // Local storage fallback for unconfigured development environment
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

      if (error) {
        console.error('Supabase update status failed:', error);
        throw new Error(`Failed to update status on server: ${error.message}`);
      }
      return mapBookingFromDb(data);
    }

    // Local storage fallback for unconfigured environment
    const current = getLocalBookings();
    const updated = current.map((b) => (b.id === id ? { ...b, status: newStatus } : b));
    saveLocalBookings(updated);
    return { id, status: newStatus };
  }
};

