import { ReactNode } from 'react';

interface ExpandableCardProps {
  children: ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  expandedHeight?: string;
  className?: string;
}

const ExpandableCard = ({ 
  children, 
  isExpanded, 
  onToggle,
  expandedHeight = 'auto',
  className = '' 
}: ExpandableCardProps) => {
  return (
    <div 
      className={`
        relative
        transition-all duration-500 ease-in-out
        ${isExpanded ? 'z-10' : 'z-0'}
        ${className}
      `}
      style={{
        height: isExpanded ? expandedHeight : undefined,
        minHeight: isExpanded ? expandedHeight : undefined,
      }}
    >
      {/* Card Content */}
      <div 
        className={`
          h-full transition-all duration-500 cursor-pointer
          ${isExpanded ? 'scale-[1.01]' : ''}
        `}
        onClick={(e) => {
          // Prevent expand on drag
          if ((e.target as HTMLElement).closest('[data-no-drag]')) {
            return;
          }
          onToggle();
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ExpandableCard;
