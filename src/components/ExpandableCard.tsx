import { ReactNode } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

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
      }}
    >
      {/* Expand/Collapse Button */}
      <div 
        className={`
          absolute top-3 right-3 z-10
          w-8 h-8 rounded-lg
          flex items-center justify-center
          bg-[#1A1A1A] border border-[hsl(var(--dashboard-border))]
          hover:bg-[#2A2A2A] hover:border-[hsl(var(--accent-neon-blue))]
          transition-all duration-200
          ${isExpanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {isExpanded ? (
          <Minimize2 className="w-4 h-4 text-foreground" />
        ) : (
          <Maximize2 className="w-4 h-4 text-foreground" />
        )}
      </div>

      {/* Card Content */}
      <div 
        className={`
          h-full transition-all duration-500 cursor-pointer
          ${isExpanded ? 'scale-[1.01]' : ''}
        `}
        onClick={onToggle}
      >
        {children}
      </div>
    </div>
  );
};

export default ExpandableCard;
