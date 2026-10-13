import { useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, ShieldCheck, Wrench, Sparkles } from 'lucide-react';
import { useGallery } from '../../hooks/useGallery';
import { useLanguage } from '../../context/LanguageContext';
import { DEFAULT_GALLERY_PHOTOS } from '../../services/galleryService';

export default function WorkshopGallery() {
  const { photos, loading } = useGallery();
  const { lang, t } = useLanguage();
  const scrollContainerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Fallback: If fewer than 3 photos, combine or fallback to curated defaults
  const displayPhotos = photos && photos.length >= 3 ? photos : DEFAULT_GALLERY_PHOTOS;

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handleScroll = (e) => {
    const el = e.target;
    const itemWidth = el.offsetWidth * 0.8;
    if (itemWidth > 0) {
      const index = Math.round(el.scrollLeft / itemWidth);
      setActiveIndex(Math.min(displayPhotos.length - 1, Math.max(0, index)));
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-brandPrimary text-xs font-bold mb-3 border border-blue-500/20">
            <Camera className="w-3.5 h-3.5" />
            <span>{t('gallery.badge', 'Authorized Facility')}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-heading tracking-tight">
            {t('gallery.title', 'Our Workshop & Facility')}
          </h2>
          <p className="text-mutedText text-xs sm:text-sm mt-1.5 max-w-2xl">
            {t('gallery.subtitle', 'Explore our state-of-the-art service bays, specialized diagnostic tools, and factory-trained technical environment in Kamburupitiya.')}
          </p>
        </div>

        {/* Carousel Arrow Controls (Visible on mobile/tablet) */}
        <div className="hidden sm:flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            aria-label="Previous photo"
            onClick={scrollLeft}
            className="w-9 h-9 rounded-xl border border-border-subtle bg-surface hover:bg-muted text-heading flex items-center justify-center transition shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={scrollRight}
            className="w-9 h-9 rounded-xl border border-border-subtle bg-surface hover:bg-muted text-heading flex items-center justify-center transition shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Snap Carousel (< 640px) */}
      <div className="block sm:hidden">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayPhotos.map((photo, idx) => {
            const title = (lang === 'si' && photo.title_si) ? photo.title_si : (photo.title_en || 'Yamaha Service Center');
            return (
              <div
                key={photo.id || idx}
                className="snap-center shrink-0 w-[85vw] max-w-[320px] bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm flex flex-col"
              >
                <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600/80 mb-1 inline-block">
                      Yamaha Facility
                    </span>
                    <p className="text-xs font-bold leading-snug line-clamp-2">
                      {title}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Carousel Dot Indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {displayPhotos.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                activeIndex === idx ? 'w-6 bg-brandPrimary' : 'w-1.5 bg-border-subtle'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tablet & Desktop Grid Layout (>= 640px) */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-5">
        {displayPhotos.slice(0, 4).map((photo, idx) => {
          const title = (lang === 'si' && photo.title_si) ? photo.title_si : (photo.title_en || 'Yamaha Service Center');

          return (
            <div
              key={photo.id || idx}
              className="group bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm hover:border-brandPrimary/40 transition duration-300 flex flex-col"
            >
              {/* Image Frame with Strict Aspect Ratio */}
              <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
                <img
                  src={photo.image_url}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Overlaid Badges & Title */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-600/90 text-white mb-1.5 inline-block backdrop-blur-xs">
                    Facility #{idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 text-white drop-shadow-xs">
                    {title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
