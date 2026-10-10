import { useState, useEffect, useCallback } from 'react';
import {
  fetchGalleryPhotos,
  uploadGalleryPhoto,
  replaceGalleryPhoto,
  deleteGalleryPhoto,
  DEFAULT_GALLERY_PHOTOS
} from '../services/galleryService';

export function useGallery() {
  const [photos, setPhotos] = useState(DEFAULT_GALLERY_PHOTOS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGalleryPhotos();
      setPhotos(data && data.length > 0 ? data : DEFAULT_GALLERY_PHOTOS);
    } catch (err) {
      console.error('Failed to load gallery photos:', err);
      setError(err.message || 'Failed to load gallery photos');
      setPhotos(DEFAULT_GALLERY_PHOTOS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const addPhoto = async (file, titleEn = '', titleSi = '') => {
    const newPhoto = await uploadGalleryPhoto(file, titleEn, titleSi);
    await loadPhotos();
    return newPhoto;
  };

  const replacePhoto = async (id, oldStoragePath, file, titleEn = '', titleSi = '') => {
    const updated = await replaceGalleryPhoto(id, oldStoragePath, file, titleEn, titleSi);
    await loadPhotos();
    return updated;
  };

  const removePhoto = async (id, storagePath) => {
    await deleteGalleryPhoto(id, storagePath);
    await loadPhotos();
  };

  return {
    photos,
    loading,
    error,
    refreshPhotos: loadPhotos,
    addPhoto,
    replacePhoto,
    removePhoto
  };
}
