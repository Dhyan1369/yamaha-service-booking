import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const MAX_DAILY_SLOTS = 12;
export const MAX_FREE_SERVICES = 5;
export const MAX_STANDARD_SERVICES = 7; // Full Service + Normal Service = 7 slots per day

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

export const getNextOpenBookingDate = () => {
  const candidate = new Date();
  candidate.setDate(candidate.getDate() + 1); // Earliest bookable day is tomorrow (advance booking rule)
  for (let i = 0; i < 30; i++) {
    const key = toDateKey(candidate);
    const dow = candidate.getDay(); // 0=Sun, 1=Mon
    if (dow !== 1 && !POYA_DATES.has(key) && !HOLIDAY_DATES.has(key)) {
      return key;
    }
    candidate.setDate(candidate.getDate() + 1);
  }
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  return toDateKey(tmr);
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

  const profile = row.profiles || null;

  return {
    id: row.id,
    tokenNo: row.token_no ?? row.tokenNo,
    timeSlot: row.time_slot ?? row.timeSlot,
    name: row.name || profile?.full_name || '',
    phone: rawPhone || profile?.phone || '',
    nic: row.nic || profile?.nic || '',
    bikeModel: row.bike_model ?? row.bikeModel ?? profile?.default_bike_model ?? '',
    mileage: row.mileage || '',
    vehicleNo: row.vehicle_no ?? row.vehicleNo ?? profile?.default_vehicle_plate ?? '',
    serviceType: row.service_type ?? row.serviceType,
    status: row.status,
    date: row.date,
    userId: row.user_id ?? row.userId,
    createdAt: row.created_at ?? row.createdAt,
    isWalkIn: Boolean(row.is_walk_in || row.nic?.toLowerCase() === 'walk-in' || row.isWalkIn),
    createdBy: row.created_by || null,
    customerNotes: row.customer_notes || '',
    profile: profile
      ? {
          fullName: profile.full_name,
          phone: profile.phone,
          nic: profile.nic,
          defaultBikeModel: profile.default_bike_model,
          defaultVehiclePlate: profile.default_vehicle_plate
        }
      : null
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

    let query = supabase
      .from('bookings')
      .select('*, profiles(full_name, phone, nic, default_bike_model, default_vehicle_plate)');

    if (dateFilter) query = query.eq('date', dateFilter);
    if (isAdmin) {
      query = query.order('token_no', { ascending: true });
    } else if (userId) {
      query = query.eq('user_id', userId).order('date', { ascending: false });
    } else {
      return [];
    }

    let { data, error } = await query;

    // Graceful fallback if public.profiles or FK constraint has not yet been applied
    if (error && (error.code === 'PGRST200' || error.message?.includes('relationship') || error.message?.includes('profiles'))) {
      let fallbackQuery = supabase.from('bookings').select('*');
      if (dateFilter) fallbackQuery = fallbackQuery.eq('date', dateFilter);
      if (isAdmin) {
        fallbackQuery = fallbackQuery.order('token_no', { ascending: true });
      } else if (userId) {
        fallbackQuery = fallbackQuery.eq('user_id', userId).order('date', { ascending: false });
      }
      const fallbackRes = await fallbackQuery;
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.error('[bookingService.getBookings] Supabase error:', error);
      throw new Error(`Failed to load bookings: ${error.message} (${error.code || ''})`);
    }
    return (data || []).map(mapBookingFromDb);
  },

  async getAvailability(date) {
    if (!isSupabaseConfigured || !supabase) {
      const localBookings = JSON.parse(localStorage.getItem('yamaha_local_bookings') || '[]');
      const activeBookings = localBookings.filter((b) => b.date === date && b.status !== 'Cancelled');
      const totalBooked = activeBookings.length;
      const freeServices = activeBookings.filter((b) => b.serviceType === 'Free Service').length;
      const standardServices = activeBookings.filter(
        (b) => b.serviceType === 'Full Service' || b.serviceType === 'Normal Service'
      ).length;
      return {
        totalBooked,
        freeServices,
        standardServices,
        availableSlots: Math.max(0, MAX_DAILY_SLOTS - totalBooked),
        availableFreeSlots: Math.max(0, MAX_FREE_SERVICES - freeServices),
        availableStandardSlots: Math.max(0, MAX_STANDARD_SERVICES - standardServices),
        maxDailySlots: MAX_DAILY_SLOTS,
        maxFreeServices: MAX_FREE_SERVICES,
        maxStandardServices: MAX_STANDARD_SERVICES
      };
    }
    const { data, error } = await supabase.rpc('get_booking_availability', { p_date: date });
    if (error) {
      console.error('[bookingService.getAvailability] Supabase error:', error);
      throw new Error(`Failed to load slot availability: ${error.message} (${error.code || ''})`);
    }
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
          throw new Error('The free-service quota for this date has been reached (Maximum 5 slots).');
        }
      }

      if (bookingData.serviceType === 'Full Service' || bookingData.serviceType === 'Normal Service') {
        const standardCount = dayActive.filter(
          (b) => b.serviceType === 'Full Service' || b.serviceType === 'Normal Service'
        ).length;
        if (standardCount >= MAX_STANDARD_SERVICES) {
          throw new Error('The quota for Full & Normal services for this date has been reached (Maximum 7 slots).');
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
        userId: bookingData.userId || null,
        isWalkIn: Boolean(bookingData.isWalkIn),
        createdBy: bookingData.createdBy || null,
        customerNotes: bookingData.customerNotes ? String(bookingData.customerNotes).trim() : '',
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

    const rpcParams = {
      p_date: bookingData.date,
      p_booking_date: bookingData.date,
      p_name: (bookingData.name || '').trim(),
      p_customer_name: (bookingData.name || '').trim(),
      p_phone: cleanPhone,
      p_nic: bookingData.nic ? bookingData.nic.trim().toUpperCase() : 'N/A',
      p_bike_model: (bookingData.bikeModel || '').trim(),
      p_vehicle_no: (bookingData.vehicleNo || '').trim().toUpperCase(),
      p_service_type: bookingData.serviceType,
      p_user_id: bookingData.userId || null,
      p_mileage: bookingData.mileage ? String(bookingData.mileage).trim() : null,
      p_customer_notes: bookingData.customerNotes ? String(bookingData.customerNotes).trim() : null,
      p_is_walk_in: Boolean(bookingData.isWalkIn),
      p_created_by: bookingData.createdBy || null
    };

    let { data: rpcData, error: rpcError } = await supabase.rpc('create_booking_transaction', rpcParams);

    // Fallback if database RPC has not yet been updated with newer parameters
    if (rpcError && (rpcError.message?.includes('Could not find') || rpcError.code === 'PGRST202')) {
      const fallbackParams = {
        p_date: bookingData.date,
        p_name: (bookingData.name || '').trim(),
        p_phone: cleanPhone,
        p_nic: bookingData.nic ? bookingData.nic.trim().toUpperCase() : 'N/A',
        p_bike_model: (bookingData.bikeModel || '').trim(),
        p_vehicle_no: (bookingData.vehicleNo || '').trim().toUpperCase(),
        p_service_type: bookingData.serviceType,
        p_user_id: bookingData.userId || null,
        p_mileage: bookingData.mileage ? String(bookingData.mileage).trim() : null
      };
      const fallbackRes = await supabase.rpc('create_booking_transaction', fallbackParams);
      rpcData = fallbackRes.data;
      rpcError = fallbackRes.error;
    }

    if (!rpcError && rpcData) return mapBookingFromDb(Array.isArray(rpcData) ? rpcData[0] : rpcData);
    if (rpcError?.message?.includes('SLOT_FULL')) {
      throw new Error('Sorry, all 12 service slots for this date are already fully booked!');
    }
    if (rpcError?.message?.includes('FREE_SERVICE_FULL')) {
      throw new Error('The free-service quota for this date has been reached (Maximum 5 slots).');
    }
    if (rpcError?.message?.includes('STANDARD_SERVICE_FULL')) {
      throw new Error('The quota for Full & Normal services for this date has been reached (Maximum 7 slots).');
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

  async updateBookingStatus(id, newStatus, scheduledDate = null) {
    if (!['Pending', 'In-Service', 'Completed', 'Cancelled'].includes(newStatus)) {
      throw new Error('Invalid booking status.');
    }

    const todayKey = toDateKey(new Date());

    if (!isSupabaseConfigured || !supabase) {
      const localBookings = JSON.parse(localStorage.getItem('yamaha_local_bookings') || '[]');
      const target = localBookings.find((b) => b.id === id);
      if (!target) throw new Error('Booking not found.');
      if ((newStatus === 'In-Service' || newStatus === 'Completed') && target.date > todayKey) {
        throw new Error('Cannot change status to In-Service or Completed before the scheduled service date.');
      }
      target.status = newStatus;
      localStorage.setItem('yamaha_local_bookings', JSON.stringify(localBookings));
      return target;
    }

    // Guard: Prevent advancing to In-Service or Completed before the service date arrives
    if (newStatus === 'In-Service' || newStatus === 'Completed') {
      let dateToCheck = scheduledDate;
      if (!dateToCheck) {
        const { data: currentBooking } = await supabase
          .from('bookings')
          .select('date')
          .eq('id', id)
          .single();
        dateToCheck = currentBooking?.date;
      }
      if (dateToCheck && dateToCheck > todayKey) {
        throw new Error('Cannot change status to In-Service or Completed before the scheduled service date.');
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('[bookingService.updateBookingStatus] error:', error);
      throw new Error(`Failed to update booking status: ${error.message} (${error.code || ''})`);
    }
    return mapBookingFromDb(data);
  },

  async cancelBooking(id) {
    if (!isSupabaseConfigured || !supabase) {
      return this.updateBookingStatus(id, 'Cancelled');
    }

    // Try RPC cancel_booking first (handles both user & admin ownership checks)
    try {
      const { data, error } = await supabase.rpc('cancel_booking', { p_booking_id: id });
      if (!error && data?.success) {
        return { id, status: 'Cancelled' };
      }
    } catch {
      // Fallback to direct update
    }

    return this.updateBookingStatus(id, 'Cancelled');
  },

  /**
   * Smart customer lookup by 10-digit Sri Lankan phone number.
   * Checks public.profiles (registered customers) first, then fallback to past bookings.
   */
  async findCustomerByPhone(phone) {
    if (!phone) return null;
    let cleanPhone = String(phone).trim().replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('+94')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('94') && cleanPhone.length === 11) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }

    if (cleanPhone.length !== 10 || !cleanPhone.startsWith('0')) return null;

    if (!isSupabaseConfigured || !supabase) {
      const localBookings = JSON.parse(localStorage.getItem('yamaha_local_bookings') || '[]');
      const past = localBookings
        .filter((b) => b.phone === cleanPhone)
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      if (!past) return null;
      return {
        source: 'past_booking',
        userId: past.userId && past.userId !== 'guest' ? past.userId : null,
        customerName: past.name,
        phone: cleanPhone,
        bikeModel: past.bikeModel,
        vehicleNo: past.vehicleNo,
        vehicles: []
      };
    }

    try {
      // 1. Look up registered profiles first
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, phone, nic, default_bike_model, default_vehicle_plate')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (!profileErr && profile) {
        let vehicles = [];
        try {
          const { data: vehData } = await supabase
            .from('vehicles')
            .select('id, bike_model, vehicle_plate, is_default')
            .eq('user_id', profile.id)
            .order('is_default', { ascending: false });
          if (vehData) vehicles = vehData;
        } catch {
          // vehicles table optional
        }

        return {
          source: 'registered_profile',
          userId: profile.id,
          customerName: profile.full_name || '',
          phone: cleanPhone,
          nic: profile.nic || '',
          bikeModel: profile.default_bike_model || '',
          vehicleNo: profile.default_vehicle_plate || '',
          vehicles: vehicles.map((v) => ({
            id: v.id,
            bikeModel: v.bike_model,
            vehiclePlate: v.vehicle_plate,
            isDefault: Boolean(v.is_default)
          }))
        };
      }

      // 2. Fallback to historical bookings for returning walk-in customers
      const { data: pastBooking, error: bkErr } = await supabase
        .from('bookings')
        .select('name, phone, nic, bike_model, vehicle_no, user_id')
        .eq('phone', cleanPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!bkErr && pastBooking) {
        return {
          source: pastBooking.user_id ? 'registered_booking' : 'past_walk_in',
          userId: pastBooking.user_id || null,
          customerName: pastBooking.name || '',
          phone: cleanPhone,
          nic: pastBooking.nic || '',
          bikeModel: pastBooking.bike_model || '',
          vehicleNo: pastBooking.vehicle_no || '',
          vehicles: []
        };
      }
    } catch (err) {
      console.warn('[bookingService.findCustomerByPhone] Lookup error:', err);
    }

    return null;
  }
};

