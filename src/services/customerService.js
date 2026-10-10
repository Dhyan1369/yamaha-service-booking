import { supabase, isSupabaseConfigured } from './supabaseClient';
import { bookingService } from './bookingService';
import { vehicleService } from './vehicleService';

const LOCAL_OVERRIDES_KEY = 'yamaha_customer_overrides';

function getLocalOverrides() {
  try {
    const raw = localStorage.getItem(LOCAL_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalOverrides(overrides) {
  try {
    localStorage.setItem(LOCAL_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.warn('[customerService] Failed to persist local overrides:', err);
  }
}

// Normalize phone to strict 10 digits 0XXXXXXXXX
export function normalizePhone(phone) {
  if (!phone) return '';
  let clean = phone.toString().trim().replace(/[\s-]/g, '');
  if (clean.startsWith('+94')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('94') && clean.length === 11) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

export const customerService = {
  /**
   * Fetches all customers along with their vehicles count and total bookings count.
   */
  async getCustomers() {
    const overrides = getLocalOverrides();
    let profilesList = [];

    // 1. Fetch from Supabase public.profiles if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          profilesList = data;
        } else if (error) {
          console.warn('[customerService.getCustomers] Supabase profiles select error:', error.message);
        }
      } catch (err) {
        console.warn('[customerService.getCustomers] Supabase connection error:', err);
      }
    }

    // 2. Fetch offline/local users from localStorage if available
    let localUsers = [];
    try {
      const rawUsers = localStorage.getItem('yamaha_users');
      if (rawUsers) {
        const parsed = JSON.parse(rawUsers);
        localUsers = Array.isArray(parsed) ? parsed : Object.values(parsed);
      }
      const rawCurrent = localStorage.getItem('yamaha_current_user');
      if (rawCurrent) {
        const cur = JSON.parse(rawCurrent);
        if (cur && cur.id && !localUsers.some((u) => u.id === cur.id || u.phone === cur.phone)) {
          localUsers.push(cur);
        }
      }
    } catch {
      // Ignore local storage parsing errors
    }

    // Combine profiles from DB and local, avoiding duplicates
    const combinedMap = new Map();

    profilesList.forEach((p) => {
      const id = p.id;
      combinedMap.set(id, {
        id,
        name: p.full_name || '',
        phone: normalizePhone(p.phone),
        nic: p.nic || '',
        role: p.role || 'customer',
        defaultBikeModel: p.default_bike_model || '',
        defaultVehiclePlate: p.default_vehicle_plate || '',
        isActive: p.is_active !== false,
        adminNotes: p.admin_notes || '',
        createdAt: p.created_at || new Date().toISOString(),
        updatedAt: p.updated_at || new Date().toISOString()
      });
    });

    localUsers.forEach((u) => {
      if (!u) return;
      const id = u.id || 'usr_' + normalizePhone(u.phone);
      if (!combinedMap.has(id)) {
        combinedMap.set(id, {
          id,
          name: u.name || u.full_name || '',
          phone: normalizePhone(u.phone),
          nic: u.nic || '',
          role: u.role || (u.isAdmin ? 'admin' : 'customer'),
          defaultBikeModel: u.bikeModel || u.defaultBikeModel || '',
          defaultVehiclePlate: u.vehicleNo || u.vehiclePlate || '',
          isActive: u.isActive !== false && u.is_active !== false,
          adminNotes: u.adminNotes || '',
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: u.updatedAt || new Date().toISOString()
        });
      }
    });

    // 3. Fetch all bookings to aggregate counts and vehicle info
    let allBookings = [];
    try {
      allBookings = await bookingService.getBookings();
    } catch {
      allBookings = [];
    }

    // Also collect any walk-in / guest customers who made bookings but have no profile
    allBookings.forEach((b) => {
      const phoneNorm = normalizePhone(b.phone);
      if (phoneNorm) {
        const existingKey = Array.from(combinedMap.keys()).find((k) => combinedMap.get(k).phone === phoneNorm);
        if (!existingKey) {
          const guestId = b.userId || 'guest_' + phoneNorm;
          combinedMap.set(guestId, {
            id: guestId,
            name: b.name || 'Walk-In Rider',
            phone: phoneNorm,
            nic: b.nic || '',
            role: 'customer',
            defaultBikeModel: b.bikeModel || '',
            defaultVehiclePlate: b.vehicleNo || '',
            isActive: true,
            adminNotes: '',
            createdAt: b.createdAt || b.date,
            updatedAt: b.createdAt || b.date
          });
        }
      }
    });

    // 4. Fetch vehicles from Supabase public.vehicles if available
    let allVehicles = [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: vData } = await supabase.from('vehicles').select('*');
        if (Array.isArray(vData)) {
          allVehicles = vData;
        }
      } catch {
        // Fall through
      }
    }

    // Convert map to array, filter out admins, apply local overrides, and attach counts
    const customers = Array.from(combinedMap.values())
      .filter((c) => c.role !== 'admin')
      .map((customer) => {
        const override = overrides[customer.id] || {};
        const activeState = override.isActive !== undefined ? override.isActive : customer.isActive;
        const notes = override.adminNotes !== undefined ? override.adminNotes : customer.adminNotes;
        const finalName = override.name || customer.name;
        const finalPhone = normalizePhone(override.phone || customer.phone);

        // Aggregate customer bookings
        const customerBookings = allBookings.filter(
          (b) => (b.userId && b.userId === customer.id) || (b.phone && normalizePhone(b.phone) === finalPhone)
        );

        // Aggregate saved vehicles
        const userSavedVehicles = allVehicles.filter((v) => v.user_id === customer.id);
        const modelsSet = new Set();
        if (customer.defaultBikeModel) modelsSet.add(customer.defaultBikeModel);
        userSavedVehicles.forEach((v) => {
          if (v.bike_model) modelsSet.add(v.bike_model);
        });
        customerBookings.forEach((b) => {
          if (b.bikeModel) modelsSet.add(b.bikeModel);
        });

        const vehiclePlatesSet = new Set();
        if (customer.defaultVehiclePlate) vehiclePlatesSet.add(customer.defaultVehiclePlate.toUpperCase());
        userSavedVehicles.forEach((v) => {
          if (v.vehicle_plate) vehiclePlatesSet.add(v.vehicle_plate.toUpperCase());
        });
        customerBookings.forEach((b) => {
          if (b.vehicleNo) vehiclePlatesSet.add(b.vehicleNo.toUpperCase());
        });

        return {
          ...customer,
          name: finalName,
          phone: finalPhone,
          isActive: activeState,
          adminNotes: notes,
          totalBookings: customerBookings.length,
          savedVehiclesCount: Math.max(modelsSet.size, userSavedVehicles.length),
          vehicleModels: Array.from(modelsSet),
          vehiclePlates: Array.from(vehiclePlatesSet)
        };
      });

    // Sort by total bookings descending, then by creation date
    return customers.sort((a, b) => {
      if (b.totalBookings !== a.totalBookings) {
        return b.totalBookings - a.totalBookings;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  },

  /**
   * Updates customer profile (Full Name, Phone Number, Admin Notes).
   */
  async updateCustomer(id, { name, phone, adminNotes }) {
    if (!id) throw new Error('Customer ID is required.');
    const cleanName = (name || '').trim();
    if (!cleanName) throw new Error('Customer full name is required.');

    const cleanPhone = normalizePhone(phone);
    if (!/^0[0-9]{9}$/.test(cleanPhone)) {
      throw new Error('Please enter a valid 10-digit Sri Lankan phone number (e.g. 0771234567).');
    }

    const trimmedNotes = (adminNotes || '').trim();

    // 1. Persist to local overrides cache immediately
    const overrides = getLocalOverrides();
    overrides[id] = {
      ...(overrides[id] || {}),
      name: cleanName,
      phone: cleanPhone,
      adminNotes: trimmedNotes
    };
    saveLocalOverrides(overrides);

    // 2. Persist to Supabase public.profiles if configured
    if (isSupabaseConfigured && supabase && !id.startsWith('usr_') && !id.startsWith('guest_')) {
      try {
        // Try complete update with admin_notes
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: cleanName,
            phone: cleanPhone,
            admin_notes: trimmedNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          // If error is due to missing admin_notes column, retry without admin_notes
          if (error.message && error.message.includes('admin_notes')) {
            console.warn('[customerService] admin_notes column missing on remote DB, saving basic fields');
            await supabase
              .from('profiles')
              .update({
                full_name: cleanName,
                phone: cleanPhone,
                updated_at: new Date().toISOString()
              })
              .eq('id', id);
          } else {
            console.warn('[customerService] Supabase update warning:', error.message);
          }
        }
      } catch (err) {
        console.warn('[customerService] Supabase update failed:', err);
      }
    }

    // 3. Update localStorage users if matched
    try {
      const rawCurrent = localStorage.getItem('yamaha_current_user');
      if (rawCurrent) {
        const cur = JSON.parse(rawCurrent);
        if (cur && (cur.id === id || normalizePhone(cur.phone) === cleanPhone)) {
          cur.name = cleanName;
          cur.phone = cleanPhone;
          cur.adminNotes = trimmedNotes;
          localStorage.setItem('yamaha_current_user', JSON.stringify(cur));
        }
      }
    } catch {
      // Ignore storage errors
    }

    return { id, name: cleanName, phone: cleanPhone, adminNotes: trimmedNotes };
  },

  /**
   * Toggles customer active status (soft delete / reactivate).
   */
  async toggleCustomerStatus(id, newActiveStatus) {
    if (!id) throw new Error('Customer ID is required.');
    const isActive = Boolean(newActiveStatus);

    // 1. Persist to local overrides cache
    const overrides = getLocalOverrides();
    overrides[id] = {
      ...(overrides[id] || {}),
      isActive
    };
    saveLocalOverrides(overrides);

    // 2. Persist to Supabase public.profiles if configured
    if (isSupabaseConfigured && supabase && !id.startsWith('usr_') && !id.startsWith('guest_')) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          console.warn('[customerService] Supabase toggle status warning:', error.message);
        }
      } catch (err) {
        console.warn('[customerService] Supabase toggle status failed:', err);
      }
    }

    // 3. Update localStorage current user if matched
    try {
      const rawCurrent = localStorage.getItem('yamaha_current_user');
      if (rawCurrent) {
        const cur = JSON.parse(rawCurrent);
        if (cur && cur.id === id) {
          cur.isActive = isActive;
          cur.is_active = isActive;
          localStorage.setItem('yamaha_current_user', JSON.stringify(cur));
        }
      }
    } catch {
      // Ignore
    }

    return { id, isActive };
  },

  /**
   * Fetches full customer history: vehicles and all bookings.
   */
  async getCustomerDetails(customerId, customerPhone) {
    const phoneNorm = normalizePhone(customerPhone);

    // 1. Fetch garage vehicles
    let vehicles = [];
    try {
      vehicles = await vehicleService.getVehicles(customerId);
    } catch {
      vehicles = [];
    }

    // 2. Fetch booking history
    let customerBookings = [];
    try {
      const allBookings = await bookingService.getBookings();
      customerBookings = allBookings
        .filter((b) => (b.userId && b.userId === customerId) || (b.phone && normalizePhone(b.phone) === phoneNorm))
        .sort((a, b) => (b.date > a.date ? 1 : -1));
    } catch {
      customerBookings = [];
    }

    return {
      vehicles,
      bookings: customerBookings
    };
  }
};
