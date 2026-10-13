import { supabase, isSupabaseConfigured } from './supabaseClient';

const LOCAL_STORAGE_INQUIRIES_KEY = 'yamaha_local_inquiries';

function getLocalInquiries() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INQUIRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalInquiries(inquiries) {
  try {
    localStorage.setItem(LOCAL_STORAGE_INQUIRIES_KEY, JSON.stringify(inquiries));
  } catch (err) {
    console.warn('[inquiryService] Local storage save failed:', err);
  }
}

export const inquiryService = {
  /**
   * Submits a customer inquiry to Supabase public.inquiries table (with offline fallback)
   */
  async submitInquiry({ name, phone, bikeModel, message }) {
    // 1. Phone number cleanup: normalize to 0XXXXXXXXX (10 digits)
    let cleanPhone = (phone || '').trim().replace(/[\s-]/g, '');
    if (cleanPhone.startsWith('+94')) {
      cleanPhone = '0' + cleanPhone.slice(3);
    } else if (cleanPhone.startsWith('94') && cleanPhone.length === 11) {
      cleanPhone = '0' + cleanPhone.slice(2);
    }

    const payload = {
      name: (name || '').trim().slice(0, 80),
      phone: cleanPhone,
      bike_model: (bikeModel || 'Yamaha Two-Wheeler').trim().slice(0, 60),
      message: (message || '').trim().slice(0, 500),
      status: 'new'
    };

    if (payload.message.length < 5) {
      throw new Error('Message must be at least 5 characters long.');
    }

    if (!/^0[0-9]{9}$/.test(payload.phone)) {
      throw new Error('Please enter a valid 10-digit phone number (e.g., 0771234567).');
    }

    // 2. Try Supabase live submission
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('inquiries')
          .insert([payload]);

        if (error) {
          console.warn('[inquiryService] Supabase insert error, saving to local cache:', error.message);
          // Fall through to local fallback
        } else {
          // Successfully inserted directly into Supabase DB table!
          const localInquiry = {
            id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            ...payload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            admin_notes: null
          };
          const existing = getLocalInquiries();
          saveLocalInquiries([localInquiry, ...existing]);
          return { success: true, data: localInquiry };
        }
      } catch (err) {
        console.warn('[inquiryService] Supabase network exception, falling back:', err);
      }
    }

    // 3. Fallback: LocalStorage persistence (e.g. offline or mock development)
    const localInquiry = {
      id: 'inq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      ...payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_notes: null
    };

    const existing = getLocalInquiries();
    saveLocalInquiries([localInquiry, ...existing]);

    return { success: true, data: localInquiry };
  },

  /**
   * Fetches all customer inquiries (Admin Only)
   */
  async getInquiries() {
    let remoteInquiries = [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          remoteInquiries = data;
        } else if (error) {
          console.warn('[inquiryService] Could not fetch inquiries from Supabase:', error.message);
        }
      } catch (err) {
        console.warn('[inquiryService] Exception fetching inquiries:', err);
      }
    }

    const localInquiries = getLocalInquiries();

    // Merge without duplicates by ID
    const map = new Map();
    remoteInquiries.forEach((item) => map.set(item.id, item));
    localInquiries.forEach((item) => {
      if (!map.has(item.id)) map.set(item.id, item);
    });

    const merged = Array.from(map.values());
    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return merged;
  },

  /**
   * Updates inquiry status ('new', 'replied', 'archived')
   */
  async updateStatus(id, newStatus, adminNotes = null) {
    if (isSupabaseConfigured && supabase && !String(id).startsWith('inq_')) {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      if (adminNotes !== null) {
        updateData.admin_notes = adminNotes;
      }

      const { data, error } = await supabase
        .from('inquiries')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.warn('[inquiryService] Supabase update failed:', error.message);
      } else {
        return data;
      }
    }

    // Also update in local storage
    const local = getLocalInquiries();
    const updated = local.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          admin_notes: adminNotes !== null ? adminNotes : item.admin_notes,
          updated_at: new Date().toISOString()
        };
      }
      return item;
    });
    saveLocalInquiries(updated);

    return updated.find((i) => i.id === id) || { id, status: newStatus };
  },

  /**
   * Permanently deletes an inquiry record
   */
  async deleteInquiry(id) {
    if (isSupabaseConfigured && supabase && !String(id).startsWith('inq_')) {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('[inquiryService] Supabase delete error:', error.message);
        throw error;
      }
    }

    const local = getLocalInquiries();
    const filtered = local.filter((item) => item.id !== id);
    saveLocalInquiries(filtered);

    return true;
  }
};
