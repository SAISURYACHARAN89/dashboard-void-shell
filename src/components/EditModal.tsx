import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const EditModal = ({ isOpen, onClose, title, children }: EditModalProps) => {
  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[95vw] max-w-[600px] max-h-[80vh] md:w-[60vw] md:max-h-[50vh] bg-[#111111] border border-[#1E1E1E] rounded-[14px] shadow-2xl animate-in zoom-in-95 fade-in duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#1E1E1E]">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default EditModal;
