import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type Timeframe = '5m' | '15m' | '1h';

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

const TimeframeSelector = ({ value, onChange }: TimeframeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const timeframes: Timeframe[] = ['5m', '15m', '1h'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1C1C] text-white text-xs font-medium hover:bg-[#2A2A2A] transition-colors"
      >
        {value}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg shadow-lg overflow-hidden z-50">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  onChange(tf);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-2 text-xs font-medium text-left transition-colors ${
                  value === tf 
                    ? 'bg-[#2A2A2A] text-white' 
                    : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TimeframeSelector;
