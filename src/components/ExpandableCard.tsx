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
        ${isExpanded ? 'relative z-50' : 'relative z-0'}
        ${className}
      `}
    >
      {/* Card Content */}
      <div 
        className={`
          transition-all duration-500 cursor-pointer
          ${isExpanded ? 'absolute inset-0 scale-[1.02] shadow-2xl' : 'relative'}
        `}
        style={{
          height: isExpanded ? expandedHeight : '100%',
          minHeight: isExpanded ? expandedHeight : undefined,
        }}
        onClick={onToggle}
      >
        {children}
      </div>
    </div>
  );
};

export default ExpandableCard;
