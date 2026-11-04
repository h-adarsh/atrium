import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col bg-white dark:bg-[#18181b] border border-[#e5e7eb] dark:border-[#27272a] rounded-[12px] shadow-none p-4 sm:p-6 z-10 my-auto overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-3.5 border-b border-[#e5e7eb] dark:border-[#27272a] shrink-0">
          <div className="pr-2">
            <h2 className="text-[17px] sm:text-[19px] font-semibold text-[#333333] dark:text-[#f4f4f5] tracking-tight">{title}</h2>
            {subtitle && <p className="text-[12px] sm:text-[13px] text-[#767676] dark:text-[#a1a1aa] mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full border border-[#e5e7eb] dark:border-[#27272a] text-[#767676] hover:text-[#333333] dark:hover:text-[#ffffff] hover:bg-[#f9f9fb] dark:hover:bg-[#27272a] transition shadow-none cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="mt-3 sm:mt-4 overflow-y-auto max-h-[calc(100vh-8rem)] pr-0.5">{children}</div>
      </div>
    </div>
  );
};
