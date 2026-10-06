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
  let rawPhone = (row.phone || '').trim();
  if (rawPhone.startsWith('+94')) {
    rawPhone = '0' + rawPhone.slice(3);
  } else if (rawPhone.startsWith('94') && rawPhone.length === 11) {
    rawPhone = '0' + rawPhone.slice(2);
  }
  return {
    id: row.id,
    tokenNo: row.token_no ?? row.tokenNo,
    timeSlot: row.time_slot ?? row.timeSlot,
    name: row.name,
    phone: rawPhone,
    nic: row.nic,
    bikeModel: row.bike_model ?? row.bikeModel,
    mileage: row.mileage || '',
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
    if (!isSupabaseConfigured || !supabase) {
      const localBookings = JSON.parse(localStorage.getItem('yamaha_local_bookings') || '[]');
      let result = [...localBookings];
      if (dateFilter) {
        result = result.filter((b) => b.date === dateFilter);
      }
      if (isAdmin) {
        result.sort((a, b) => a.tokenNo - b.tokenNo);
      } else if (userId) {
        result = result.filter((b) => b.userId === userId);
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      return result;
    }

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
    if (!isSupabaseConfigured || !supabase) {
      const localBookings = JSON.parse(localStorage.getItem('yamaha_local_bookings') || '[]');
      const activeBookings = localBookings.filter((b) => b.date === date && b.status !== 'Cancelled');
      const totalBooked = activeBookings.length;
      const freeServices = activeBookings.filter((b) => b.serviceType === 'Free Service').length;
      return {
        totalBooked,
        freeServices,
        availableSlots: Math.max(0, MAX_DAILY_SLOTS - totalBooked),
        availableFreeSlots: Math.max(0, MAX_FREE_SERVICES - freeServices),
        maxDailySlots: MAX_DAILY_SLOTS,
        maxFreeServices: MAX_FREE_SERVICES
      };
    }
    const { data, error } = await supabase.rpc('get_booking_availability', { p_date: date });
    if (error) throw new Error('Failed to load slot availability. Please try again.');
    return data;
  },

  async createBooking(bookingData) {
    const _now = new Date();
    const todayKey = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;

    // Customer bookings must be placed before 11:59 PM of the previous day (no same-day bookings)
    if (!bookingData.isAdmin && !bookingData.isWalkIn && bookingData.date <= todayKey) {
      if (bookingData.date === todayKey) {
        throw new Error(
          'අද දිනය සඳහා booking දැමිය නොහැක. ඕනෑම දිනයක් සඳහා booking එකක් දැමිය හැක්කේ ඊට පෙර දින රාත්‍රී 11:59 PM වන තෙක් පමණි. (Bookings must be made by 11:59 PM of the day before).'
        );
      }
      throw new Error('පසුගිය දින සඳහා booking දැමිය නොහැක. (Cannot book a past date).');
    }

    if (!isSupabaseConfigured || !supabase) {
      const localBookings = JSON.parse(localStorage.getItem('yamaha_local_bookings') || '[]');
      const dayActive = localBookings.filter(
        (b) => b.date === bookingData.date && b.status !== 'Cancelled'
      );

      if (dayActive.length >= MAX_DAILY_SLOTS) {
        throw new Error('Sorry, all 12 service slots for this date are already fully booked!');
      }

      if (bookingData.serviceType === 'Free Service') {
        const freeCount = dayActive.filter((b) => b.serviceType === 'Free Service').length;
        if (freeCount >= MAX_FREE_SERVICES) {
          throw new Error('The free-service quota for this date has been reached.');
        }
      }

      const duplicateVehicle = dayActive.some(
        (b) => b.vehicleNo?.toUpperCase() === bookingData.vehicleNo?.trim().toUpperCase()
      );
      if (duplicateVehicle) {
        throw new Error('This vehicle already has a booking for the selected date.');
      }

      let cleanPhone = (bookingData.phone || '').trim().replace(/[\s-]/g, '');
      if (cleanPhone.startsWith('+94')) {
        cleanPhone = '0' + cleanPhone.slice(3);
      } else if (cleanPhone.startsWith('94') && cleanPhone.length === 11) {
        cleanPhone = '0' + cleanPhone.slice(2);
      }

      const nextToken = dayActive.length + 1;
      const newBooking = {
        id: 'local_bk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        tokenNo: nextToken,
        timeSlot: calculateSlotTime(nextToken),
        name: bookingData.name.trim(),
        phone: cleanPhone,
        nic: bookingData.nic ? bookingData.nic.trim().toUpperCase() : 'N/A',
        bikeModel: bookingData.bikeModel.trim(),
        mileage: bookingData.mileage ? String(bookingData.mileage).trim() : '',
        vehicleNo: bookingData.vehicleNo.trim().toUpperCase(),
        serviceType: bookingData.serviceType,
        status: 'Pending',
        date: bookingData.date,
        userId: bookingData.userId || 'guest',
        createdAt: new Date().toISOString()
      };

      localBookings.push(newBooking);
      localStorage.setItem('yamaha_local_bookings', JSON.stringify(localBookings));
      return newBooking;
    }

    let cleanPhone = (bookingData.phone || '').trim().replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('+94')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('94') && cleanPhone.length === 11) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('create_booking_transaction', {
      p_date: bookingData.date,
      p_name: bookingData.name,
      p_phone: cleanPhone,
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
    if (
      rpcError?.message?.includes('BOOKING_CLOSED_FOR_DATE') ||
      rpcError?.message?.includes('PAST_DATE')
    ) {
      throw new Error(
        'අද දිනය හෝ පසුගිය දින සඳහා booking දැමිය නොහැක. ඕනෑම දිනයක් සඳහා booking එකක් දැමිය හැක්කේ ඊට පෙර දින රාත්‍රී 11:59 PM වන තෙක් පමණි.'
      );
    }
    throw new Error('Booking could not be created. Please try again.');
  },

  async updateBookingStatus(id, newStatus) {
    if (!['Pending', 'In-Service', 'Completed', 'Cancelled'].includes(newStatus)) {
      throw new Error('Invalid booking status.');
    }

    if (!isSupabaseConfigured || !supabase) {
      const localBookings = JSON.parse(localStorage.getItem('yamaha_local_bookings') || '[]');
      const target = localBookings.find((b) => b.id === id);
      if (!target) throw new Error('Booking not found.');
      target.status = newStatus;
      localStorage.setItem('yamaha_local_bookings', JSON.stringify(localBookings));
      return target;
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

