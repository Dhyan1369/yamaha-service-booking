import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const DEFAULT_GALLERY_PHOTOS = [
  {
    id: 'default-1',
    image_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80',
    storage_path: '',
    title_en: 'Modern Hydraulic Service Bays & Diagnostic Area',
    title_si: 'නවීන හයිඩ්‍රොලික් සේවා බේ සහ පරිගණක පරීක්ෂණ අංශය',
    display_order: 1
  },
  {
    id: 'default-2',
    image_url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
    storage_path: '',
    title_en: 'Yamaha Certified Computerized Diagnostics (YDT)',
    title_si: 'යමහා සහතිකලත් පරිගණක දෝෂ හඳුනාගැනීමේ පද්ධතිය',
    display_order: 2
  },
  {
    id: 'default-3',
    image_url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80',
    storage_path: '',
    title_en: '100% Genuine Yamalube Oils & Factory Spare Parts',
    title_si: '100% අව්‍යාජ යමලූබ් ලිහිසි තෙල් සහ කර්මාන්තශාලා අමතර කොටස්',
    display_order: 3
  },
  {
    id: 'default-4',
    image_url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80',
    storage_path: '',
    title_en: 'High-Precision Engine Overhaul & Periodic Tune-Up',
    title_si: 'ඉහළ නිරවද්‍යතා එන්ජින් පරීක්ෂාව සහ කාලීන නඩත්තු සේවාව',
    display_order: 4
  }
];

const LOCAL_STORAGE_KEY = 'yamaha_gallery_photos';

// Helper to get local cache
function getLocalPhotos() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local gallery cache:', e);
  }
  return DEFAULT_GALLERY_PHOTOS;
}

// Helper to save local cache
function setLocalPhotos(photos) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(photos));
  } catch (e) {
    console.warn('Failed to save local gallery cache:', e);
  }
}

// Client-side image compression
export function compressGalleryImage(file, maxWidth = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                dataUrl: canvas.toDataURL('image/jpeg', quality)
              });
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// Fetch all photos
export async function fetchGalleryPhotos() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase gallery query error, falling back to local:', error.message);
        return getLocalPhotos();
      }

      if (data && data.length > 0) {
        setLocalPhotos(data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase gallery exception, using fallback:', err);
    }
  }

  return getLocalPhotos();
}

// Upload a new photo (Admin only)
export async function uploadGalleryPhoto(file, titleEn = '', titleSi = '') {
  // 1. Validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file format. Please upload JPEG, PNG, or WebP images.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size exceeds 5 MB. Please select a smaller photo.');
  }

  // 2. Compress image
  const { blob, dataUrl } = await compressGalleryImage(file, 1400, 0.85);

  let finalUrl = dataUrl;
  let finalPath = '';
  const newId = crypto.randomUUID ? crypto.randomUUID() : `photo-${Date.now()}`;

  // 3. Supabase upload if available
  if (isSupabaseConfigured && supabase) {
    const fileExt = 'jpg';
    finalPath = `photos/gallery_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const uploadFile = new File([blob], `gallery.${fileExt}`, { type: 'image/jpeg' });

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(finalPath, uploadFile, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload photo to storage: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(finalPath);

    if (publicUrlData?.publicUrl) {
      finalUrl = publicUrlData.publicUrl;
    }

    // Insert into DB
    const { data: inserted, error: dbError } = await supabase
      .from('gallery_photos')
      .insert({
        image_url: finalUrl,
        storage_path: finalPath,
        title_en: titleEn || 'Yamaha Workshop Facility',
        title_si: titleSi || 'යමහා සේවා මධ්‍යස්ථානය',
        display_order: Date.now() % 1000
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save photo record to database:', dbError);
      throw new Error(`Database record failed: ${dbError.message}`);
    }

    // Update local cache
    const current = getLocalPhotos();
    const updated = [...current, inserted];
    setLocalPhotos(updated);
    return inserted;
  }

  // Local fallback
  const newPhoto = {
    id: newId,
    image_url: finalUrl,
    storage_path: '',
    title_en: titleEn || 'Yamaha Workshop Facility',
    title_si: titleSi || 'යමහා සේවා මධ්‍යස්ථානය',
    display_order: Date.now() % 1000,
    created_at: new Date().toISOString()
  };

  const current = getLocalPhotos();
  const updated = [...current, newPhoto];
  setLocalPhotos(updated);
  return newPhoto;
}

// Replace an existing photo
export async function replaceGalleryPhoto(id, oldStoragePath, file, titleEn = '', titleSi = '') {
  // 1. Validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file format. Please upload JPEG, PNG, or WebP images.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size exceeds 5 MB. Please select a smaller photo.');
  }

  const { blob, dataUrl } = await compressGalleryImage(file, 1400, 0.85);
  let finalUrl = dataUrl;
  let newPath = '';

  if (isSupabaseConfigured && supabase) {
    // Delete old file if present
    if (oldStoragePath) {
      try {
        await supabase.storage.from('gallery').remove([oldStoragePath]);
      } catch (e) {
        console.warn('Failed to remove old file:', e);
      }
    }

    const fileExt = 'jpg';
    newPath = `photos/gallery_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const uploadFile = new File([blob], `gallery.${fileExt}`, { type: 'image/jpeg' });

    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(newPath, uploadFile, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('gallery')
      .getPublicUrl(newPath);

    if (publicUrlData?.publicUrl) {
      finalUrl = publicUrlData.publicUrl;
    }

    const updatePayload = {
      image_url: finalUrl,
      storage_path: newPath,
      updated_at: new Date().toISOString()
    };
    if (titleEn) updatePayload.title_en = titleEn;
    if (titleSi) updatePayload.title_si = titleSi;

    const { data: updatedRecord, error: dbError } = await supabase
      .from('gallery_photos')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      throw new Error(`Failed to update record: ${dbError.message}`);
    }

    const current = getLocalPhotos();
    const updated = current.map((p) => (p.id === id ? updatedRecord : p));
    setLocalPhotos(updated);
    return updatedRecord;
  }

  // Local fallback
  const current = getLocalPhotos();
  const updated = current.map((p) =>
    p.id === id
      ? {
          ...p,
          image_url: finalUrl,
          title_en: titleEn || p.title_en,
          title_si: titleSi || p.title_si
        }
      : p
  );
  setLocalPhotos(updated);
  return updated.find((p) => p.id === id);
}

// Delete a photo (Storage + DB)
export async function deleteGalleryPhoto(id, storagePath) {
  if (isSupabaseConfigured && supabase) {
    if (storagePath) {
      try {
        await supabase.storage.from('gallery').remove([storagePath]);
      } catch (e) {
        console.warn('Failed to remove file from Supabase storage:', e);
      }
    }

    const { error } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete photo record: ${error.message}`);
    }
  }

  const current = getLocalPhotos();
  const updated = current.filter((p) => p.id !== id);
  setLocalPhotos(updated);
  return true;
}
