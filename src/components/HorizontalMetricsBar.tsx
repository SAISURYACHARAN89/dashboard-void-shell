import { useState } from 'react';
import { Check } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  accentColor: string;
  tooltip: string;
  isPaid?: boolean;
}

const HorizontalMetricsBar = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const metrics: Metric[] = [
    {
      label: 'BND',
      value: '187%',
      accentColor: '#00FFFF',
      tooltip: 'BND = Bundle percentage',
    },
    {
      label: 'S',
      value: '12%',
      accentColor: '#FF00FF',
      tooltip: 'S = Spread percentage',
    },
    {
      label: 'IN',
      value: '10%',
      accentColor: '#FFA500',
      tooltip: 'IN = Inflow percentage',
    },
    {
      label: 'DEX',
      value: 'Paid',
      accentColor: '#2ECC71',
      tooltip: 'DEX = Paid status verified',
      isPaid: true,
    },
  ];

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-full py-4 px-2 relative"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 relative">
        {metrics.map((metric, index) => (
          <div key={metric.label} className="relative">
            {/* Segment */}
            <div
              className="flex flex-col items-center justify-center py-2 px-4 cursor-pointer transition-all duration-200 hover:scale-105"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {metric.label}
              </div>
              <div className="flex items-center gap-1.5">
                <div 
                  className="text-xl font-bold text-foreground"
                  style={{ color: metric.accentColor }}
                >
                  {metric.value}
                </div>
                {metric.isPaid && (
                  <Check className="w-4 h-4" style={{ color: metric.accentColor }} />
                )}
              </div>

              {/* Tooltip */}
              {hoveredIndex === index && (
                <div 
                  className="absolute -top-14 left-1/2 -translate-x-1/2 z-10 animate-fade-in"
                  style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    minWidth: '160px',
                    boxShadow: `0 0 12px ${metric.accentColor}40`,
                  }}
                >
                  <div className="text-white text-xs text-center whitespace-nowrap">
                    {metric.tooltip}
                  </div>
                  {/* Arrow */}
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                    style={{ background: 'rgba(0, 0, 0, 0.9)' }}
                  />
                </div>
              )}
            </div>

            {/* Divider Line (except for last item on desktop) */}
            {index < metrics.length - 1 && (
              <div 
                className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12"
                style={{
                  background: `linear-gradient(180deg, transparent, ${metric.accentColor}80, transparent)`,
                  boxShadow: `0 0 4px ${metric.accentColor}40`,
                }}
              />
            )}

            {/* Mobile divider - bottom of first row */}
            {index === 1 && (
              <div 
                className="sm:hidden absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${metric.accentColor}80, transparent)`,
                  boxShadow: `0 0 4px ${metric.accentColor}40`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalMetricsBar;
