import { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, RefreshCw, CheckCircle2, AlertCircle, Plus, Sparkles, Camera } from 'lucide-react';
import { useGallery } from '../../hooks/useGallery';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../common/Button';

export default function GalleryManager() {
  const { photos, loading, addPhoto, replacePhoto, removePhoto } = useGallery();
  const { lang, t } = useLanguage();

  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleSi, setTitleSi] = useState('');

  const fileInputRef = useRef(null);
  const replaceInputRefs = useRef({});

  const MAX_PHOTOS = 4;
  const isMaxReached = photos.length >= MAX_PHOTOS;

  const showToast = (success, message) => {
    if (success) {
      setSuccessMsg(message);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(message);
      setSuccessMsg('');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast(false, 'Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(false, 'File size exceeds 5 MB. Please select a smaller photo.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      await addPhoto(selectedFile, titleEn.trim(), titleSi.trim());
      showToast(true, 'Workshop photo uploaded successfully!');
      setShowAddModal(false);
      setSelectedFile(null);
      setFilePreview('');
      setTitleEn('');
      setTitleSi('');
    } catch (err) {
      showToast(false, err.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const handleReplaceFile = async (photo, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast(false, 'Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(false, 'File size exceeds 5 MB. Please select a smaller photo.');
      return;
    }

    setReplacingId(photo.id);
    try {
      await replacePhoto(photo.id, photo.storage_path, file, photo.title_en, photo.title_si);
      showToast(true, 'Workshop photo replaced successfully!');
    } catch (err) {
      showToast(false, err.message || 'Failed to replace photo.');
    } finally {
      setReplacingId(null);
    }
  };

  const handleDelete = async (photo) => {
    if (!window.confirm('Are you sure you want to delete this workshop photo from the gallery?')) {
      return;
    }

    try {
      await removePhoto(photo.id, photo.storage_path);
      showToast(true, 'Workshop photo removed.');
    } catch (err) {
      showToast(false, err.message || 'Failed to delete photo.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <div className="bg-surface border border-border p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-mainText flex items-center gap-2">
              <Camera className="w-5 h-5 text-brandPrimary" />
              <span>Workshop & Facility Photos</span>
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-brandPrimary border border-blue-500/20 text-[11px] font-bold">
              {photos.length} / {MAX_PHOTOS} Photos
            </span>
          </div>
          <p className="text-xs text-mutedText mt-1">
            Featured photos displayed in the "Our Workshop & Facility" gallery on the customer Home page.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="primary"
            size="md"
            disabled={isMaxReached || uploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Workshop Photo</span>
          </Button>
        </div>
      </div>

      {/* Toast Feedback */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Photo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {photos.map((photo, index) => {
          const isReplacing = replacingId === photo.id;

          return (
            <div
              key={photo.id || index}
              className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:border-brandPrimary/40 transition"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-video w-full bg-surfaceMuted overflow-hidden">
                <img
                  src={photo.image_url}
                  alt={photo.title_en || `Workshop photo ${index + 1}`}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Index badge */}
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold">
                  Slot #{index + 1}
                </div>

                {isReplacing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                    <span>Replacing image...</span>
                  </div>
                )}
              </div>

              {/* Photo Meta & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-mainText line-clamp-1">
                    {photo.title_en || 'Yamaha Workshop Facility'}
                  </h3>
                  {photo.title_si && (
                    <p className="text-xs text-mutedText mt-0.5 line-clamp-1">
                      {photo.title_si}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border gap-2">
                  <input
                    ref={(el) => (replaceInputRefs.current[photo.id] = el)}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleReplaceFile(photo, e)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isReplacing}
                    onClick={() => replaceInputRefs.current[photo.id]?.click()}
                    className="flex-1 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    <span>Replace</span>
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isReplacing}
                    onClick={() => handleDelete(photo)}
                    className="text-xs px-3"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty Slot Card placeholder if fewer than 4 */}
        {!isMaxReached && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-brandPrimary/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-surface/50 hover:bg-surfaceMuted/50 min-h-[260px] group"
          >
            <div className="w-12 h-12 rounded-xl bg-brandPrimary/10 border border-brandPrimary/20 text-brandPrimary flex items-center justify-center mb-3 group-hover:scale-110 transition">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-mainText">Add Photo #{photos.length + 1}</h4>
            <p className="text-xs text-mutedText mt-1 max-w-xs">
              Upload clear JPEG, PNG, or WebP photo up to 5 MB.
            </p>
            <span className="mt-3 text-xs font-semibold text-brandPrimary group-hover:underline">
              + Choose from Computer
            </span>
          </div>
        )}
      </div>

      {/* Add Photo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="fixed inset-0"
            onClick={() => {
              setShowAddModal(false);
              setSelectedFile(null);
              setFilePreview('');
            }}
            aria-hidden="true"
          />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 relative z-10 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Upload New Workshop Photo</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedFile(null);
                  setFilePreview('');
                }}
                className="text-mutedText hover:text-mainText text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Preview */}
            {filePreview && (
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-surfaceMuted border border-border">
                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-subText mb-1">
                  Title / Caption (English)
                </label>
                <input
                  type="text"
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  placeholder="e.g. Modern Hydraulic Service Bays"
                  className="w-full bg-surfaceMuted border border-border rounded-xl px-3 py-2 text-mainText text-sm outline-none focus:border-brandPrimary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-subText mb-1">
                  Title / Caption (Sinhala)
                </label>
                <input
                  type="text"
                  value={titleSi}
                  onChange={(e) => setTitleSi(e.target.value)}
                  placeholder="e.g. නවීන සේවා බේ සහ පරිගණක පරීක්ෂණ අංශය"
                  className="w-full bg-surfaceMuted border border-border rounded-xl px-3 py-2 text-mainText text-sm outline-none focus:border-brandPrimary"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedFile(null);
                    setFilePreview('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={uploading}
                >
                  {uploading ? 'Uploading...' : 'Confirm Upload'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
