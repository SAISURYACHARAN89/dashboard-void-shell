import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface EditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  position?: 'right' | 'top';
}

const EditPanel = ({ isOpen, onClose, title, children, position = 'right' }: EditPanelProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={`
          fixed z-50
          bg-[#111111] border border-[#1E1E1E] rounded-lg shadow-lg
          bottom-0 left-0 right-0 md:bottom-auto md:left-auto md:right-6 md:top-16 md:w-80
          max-h-[70vh] md:max-h-[500px]
          animate-in slide-in-from-bottom md:slide-in-from-right
          duration-200
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1E1E1E]">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(70vh-60px)] md:max-h-[calc(500px-60px)]">
          {children}
        </div>
      </div>
    </>
  );
};

export default EditPanel;
