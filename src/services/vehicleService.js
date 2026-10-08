import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_STORAGE_KEY_PREFIX = 'yamaha_vehicles_';

function getLocalVehicles(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + userId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalVehicles(userId, list) {
  if (!userId) return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + userId, JSON.stringify(list));
  } catch {
    // Ignore storage errors
  }
}

export const vehicleService = {
  /**
   * Fetch all vehicles for a user.
   * If supabase is not configured or table does not exist, uses localStorage with profile fallback.
   */
  async getVehicles(userId, profileFallback = null) {
    if (!userId) return [];

    let vehicles = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('vehicles')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: true });

        if (!error && Array.isArray(data)) {
          vehicles = data.map((v) => ({
            id: v.id,
            userId: v.user_id,
            bikeModel: v.bike_model,
            vehiclePlate: v.vehicle_plate,
            isDefault: Boolean(v.is_default),
            createdAt: v.created_at,
            updatedAt: v.updated_at
          }));
          saveLocalVehicles(userId, vehicles);
        } else if (error) {
          console.warn('[vehicleService.getVehicles] Supabase error, falling back to local cache:', error.message);
          vehicles = getLocalVehicles(userId);
        }
      } catch (err) {
        console.warn('[vehicleService.getVehicles] Network error, falling back to local cache:', err);
        vehicles = getLocalVehicles(userId);
      }
    } else {
      vehicles = getLocalVehicles(userId);
    }

    // If no vehicles found in DB/local, but profile has a default motorcycle, synthesize one
    if (vehicles.length === 0 && profileFallback?.vehiclePlate) {
      const synthesized = {
        id: 'synth_' + Date.now(),
        userId,
        bikeModel: profileFallback.bikeModel || 'Yamaha FZ-S V3',
        vehiclePlate: profileFallback.vehiclePlate.trim().toUpperCase(),
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      vehicles = [synthesized];
      saveLocalVehicles(userId, vehicles);
    }

    return vehicles;
  },

  /**
   * Add a new vehicle to user's garage.
   */
  async addVehicle({ userId, bikeModel, vehiclePlate, isDefault = false }) {
    if (!userId) throw new Error('User ID is required to register a vehicle.');
    const cleanPlate = (vehiclePlate || '').trim().toUpperCase();
    const cleanModel = (bikeModel || '').trim() || 'Yamaha FZ-S V3';

    if (!cleanPlate) throw new Error('Vehicle plate number is required.');

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          user_id: userId,
          bike_model: cleanModel,
          vehicle_plate: cleanPlate,
          is_default: isDefault
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique')) {
          throw new Error('This vehicle plate is already registered in your garage.');
        }
        throw new Error(error.message || 'Failed to add vehicle.');
      }

      const formatted = {
        id: data.id,
        userId: data.user_id,
        bikeModel: data.bike_model,
        vehiclePlate: data.vehicle_plate,
        isDefault: Boolean(data.is_default),
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      // Update local storage
      const existing = getLocalVehicles(userId);
      const updatedList = isDefault
        ? existing.map((v) => ({ ...v, isDefault: false }))
        : existing;
      saveLocalVehicles(userId, [formatted, ...updatedList]);

      return formatted;
    }

    // Offline / LocalStorage implementation
    const existing = getLocalVehicles(userId);
    if (existing.some((v) => v.vehiclePlate === cleanPlate)) {
      throw new Error('This vehicle plate is already registered in your garage.');
    }

    const newVehicle = {
      id: 'local_veh_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId,
      bikeModel: cleanModel,
      vehiclePlate: cleanPlate,
      isDefault: existing.length === 0 ? true : Boolean(isDefault),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedList = newVehicle.isDefault
      ? existing.map((v) => ({ ...v, isDefault: false }))
      : existing;

    const finalList = [newVehicle, ...updatedList];
    saveLocalVehicles(userId, finalList);
    return newVehicle;
  },

  /**
   * Delete a vehicle by ID.
   */
  async deleteVehicle(vehicleId, userId) {
    if (!vehicleId) throw new Error('Vehicle ID is required.');

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) {
        throw new Error(error.message || 'Failed to delete vehicle.');
      }
    }

    // Update local storage
    if (userId) {
      const existing = getLocalVehicles(userId);
      const remaining = existing.filter((v) => v.id !== vehicleId);
      // If we deleted the default vehicle, promote the first remaining vehicle to default
      if (remaining.length > 0 && !remaining.some((v) => v.isDefault)) {
        remaining[0].isDefault = true;
      }
      saveLocalVehicles(userId, remaining);
    }

    return true;
  },

  /**
   * Set a vehicle as the user's primary/default.
   */
  async setDefaultVehicle(vehicleId, userId) {
    if (!vehicleId || !userId) throw new Error('Vehicle ID and User ID are required.');

    if (isSupabaseConfigured && supabase) {
      // Unset other defaults
      await supabase
        .from('vehicles')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Set target vehicle default
      const { data, error } = await supabase
        .from('vehicles')
        .update({ is_default: true })
        .eq('id', vehicleId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message || 'Failed to update default vehicle.');
      }

      // Sync with profiles table
      if (data) {
        await supabase
          .from('profiles')
          .update({
            default_bike_model: data.bike_model,
            default_vehicle_plate: data.vehicle_plate
          })
          .eq('id', userId);
      }
    }

    // Update local storage
    const existing = getLocalVehicles(userId);
    const updated = existing.map((v) => ({
      ...v,
      isDefault: v.id === vehicleId
    }));
    saveLocalVehicles(userId, updated);

    return true;
  }
};
