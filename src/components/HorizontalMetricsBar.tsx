import { useState } from 'react';
import { Check } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  tooltip: string;
  isPaid?: boolean;
}

interface HorizontalMetricsBarProps {
  isExpanded: boolean;
  data?: {
    marketCapUSD: number;
    volumeUSD: number;
    holders: number;
    liquidityUSD: number;
    uniqueAuthors: number;
    memberCount: number;
    solPrice: number;
    lastUpdated: string;
    bundlersHoldPercent: string;
    snipersHoldPercent: string;
    top10HoldersPercent: string;
    insidersHoldPercent: string;
    dexPaid: string;
  };
}

const HorizontalMetricsBar = ({ isExpanded = false, data }: HorizontalMetricsBarProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const metrics: Metric[] = [
    {
      label: 'BND',
      // value: `${data?.bundlersHoldPercent || 'N/A'}`,
      value: `${data?.bundlersHoldPercent ? Number(data.bundlersHoldPercent).toFixed(2) + "%" : 'N/A'}`,
      tooltip: 'BND = Bundle percentage',
    },
    {
      label: 'S',
      value: `${data?.snipersHoldPercent ? Number(data.snipersHoldPercent).toFixed(2) + "%" : 'N/A'}`,
      tooltip: 'S = Spread percentage',
    },
    {
      label: 'IN',
      value: `${data?.insidersHoldPercent ? Number(data.insidersHoldPercent).toFixed(2) + "%" : 'N/A'}`,
      tooltip: 'IN = Inflow percentage',
    },
    {
      label: 'DEX',
      value: `${data?.dexPaid ? Number(data.dexPaid) == 1 ? 'Paid' : 'Unpaid' : 'N/A'}`,
      tooltip: 'DEX = Paid status verified',
      isPaid: true,
    },
  ];

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-lg py-3 px-4 relative transition-all duration-300 hover:scale-[1.005]"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      {isExpanded && (
        <div className="mb-4">
          <h3 className="text-foreground text-lg font-semibold">Key Metrics Overview</h3>
          <p className="text-muted-foreground text-xs mt-1">Comprehensive dashboard metrics with detailed tooltips</p>
        </div>
      )}
      <div className={`grid ${isExpanded ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'} gap-${isExpanded ? '4' : '0'} relative`}>
        {metrics.map((metric, index) => (
          <div key={metric.label} className="relative">
            {/* Segment */}
            <div
              className="flex items-center justify-center gap-3 py-1 px-4 cursor-pointer transition-opacity duration-200 hover:opacity-80"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {metric.label}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-lg font-bold text-foreground">
                  {metric.value}
                </div>
                {metric.isPaid && (
                  <Check className="w-3.5 h-3.5 text-foreground" />
                )}
              </div>

              {/* Tooltip */}
              {hoveredIndex === index && (
                <div 
                  className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 animate-fade-in bg-black/90 px-3 py-2 rounded-lg border border-[hsl(var(--dashboard-border))]"
                  style={{ minWidth: '160px' }}
                >
                  <div className="text-white text-xs text-center whitespace-nowrap">
                    {metric.tooltip}
                  </div>
                  {/* Arrow */}
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-black/90 border-r border-b border-[hsl(var(--dashboard-border))]"
                  />
                </div>
              )}
            </div>

            {/* Divider Line (except for last item on desktop) */}
            {index < metrics.length - 1 && (
              <div 
                className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-[hsl(var(--dashboard-border))]"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorizontalMetricsBar;
