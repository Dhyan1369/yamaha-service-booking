import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
  bodyPadding = 'p-4 sm:p-6',
  className = '',
  showClose = true
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div
        className={`w-full ${maxWidth} max-h-[calc(100vh-1.5rem)] overflow-y-auto ${bodyPadding} rounded-2xl relative z-10 transition-colors duration-200 ${className}`}
        style={{
          background: 'linear-gradient(145deg, #0f182c 0%, #0a0f1d 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(37, 99, 235, 0.25)',
          color: 'var(--text-heading)',
        }}
        role="dialog"
        aria-modal="true"
      >
        {title || subtitle ? (
          <div className="flex items-start justify-between mb-3.5 pb-2 border-b border-white/5">
            <div>
              {title && <h3 className="text-xl font-bold text-white">{title}</h3>}
              {subtitle && <p className="text-xs text-subText mt-1">{subtitle}</p>}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 text-mutedText hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ) : showClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 p-1.5 text-mutedText hover:text-white hover:bg-white/10 rounded-lg transition z-20"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
