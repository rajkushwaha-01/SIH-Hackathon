import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-2xl',
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
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative w-full bg-surface-container-lowest border border-outline-variant rounded-lg shadow-modal overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-150',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <div>
            <h3 className="text-lg font-bold text-on-surface leading-tight">{title}</h3>
            {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-outline-variant bg-surface-container-low">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
