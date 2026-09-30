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

export const bookingService = {
  async getBookings(dateFilter = null, { userId = null, isAdmin = false } = {}) {
    if (!isSupabaseConfigured || !supabase) return [];

    let query = supabase.from('bookings').select('*');
    if (dateFilter) query = query.eq('date', dateFilter);
    if (isAdmin) {
      query = query.order('token_no', { ascending: true });
    } else if (userId) {
      query = query.eq('user_id', userId).order('date', { ascending: false });
    } else {
      return [];
    }

    const { data, error } = await query;
    if (error) throw new Error('Failed to load bookings. Please try again.');
    return (data || []).map(mapBookingFromDb);
  },

  async getAvailability(date) {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase.rpc('get_booking_availability', { p_date: date });
    if (error) throw new Error('Failed to load slot availability. Please try again.');
    return data;
  },

  async createBooking(bookingData) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Booking is unavailable until Supabase is configured.');
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('create_booking_transaction', {
      p_date: bookingData.date,
      p_name: bookingData.name,
      p_phone: bookingData.phone,
      p_nic: bookingData.nic,
      p_bike_model: bookingData.bikeModel,
      p_vehicle_no: bookingData.vehicleNo,
      p_service_type: bookingData.serviceType,
      p_user_id: bookingData.userId
    });

    if (!rpcError && rpcData) return mapBookingFromDb(Array.isArray(rpcData) ? rpcData[0] : rpcData);
    if (rpcError?.message?.includes('SLOT_FULL')) {
      throw new Error('Sorry, all 12 service slots for this date are already fully booked!');
    }
    if (rpcError?.message?.includes('FREE_SERVICE_FULL')) {
      throw new Error('The free-service quota for this date has been reached.');
    }
    if (rpcError?.message?.includes('DUPLICATE_BOOKING')) {
      throw new Error('This vehicle already has a booking for the selected date.');
    }
    if (rpcError?.message?.includes('CLOSED_DATE')) {
      throw new Error('The workshop is closed on the selected date.');
    }
    throw new Error('Booking could not be created. Please try again.');
  },

  async updateBookingStatus(id, newStatus) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Status updates are unavailable until Supabase is configured.');
    }
    if (!['Pending', 'In-Service', 'Completed', 'Cancelled'].includes(newStatus)) {
      throw new Error('Invalid booking status.');
    }
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error('Failed to update booking status.');
    return mapBookingFromDb(data);
  }
};

