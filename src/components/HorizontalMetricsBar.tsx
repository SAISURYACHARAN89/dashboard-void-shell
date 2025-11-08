// components/TokenInfoSection.tsx
import { useState } from 'react';
import { Check } from 'lucide-react';
import useRealTimeData from '@/hooks/useRealTimeData'; // ✅ your custom hook

// --- Types ---
interface Metric {
  label: string;
  value: string;
  tooltip: string;
  isPaid?: boolean;
}

interface HorizontalMetricsBarProps {
  isExpanded: boolean;
  data?: {
    bundlersHoldPercent: string | number;
    snipersHoldPercent: string | number;
    top10HoldersPercent: string | number;
    insidersHoldPercent: string | number;
    dexPaid: string | number;
  };
}

// --- Horizontal Metrics Bar Component ---
const HorizontalMetricsBar = ({ isExpanded = false, data }: HorizontalMetricsBarProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const metrics: Metric[] = [
    {
      label: 'BND',
      value: data?.bundlersHoldPercent
        ? `${Number(data.bundlersHoldPercent).toFixed(2)}%`
        : 'N/A',
      tooltip: 'BND = Bundle percentage',
    },
    {
      label: 'S',
      value: data?.snipersHoldPercent
        ? `${Number(data.snipersHoldPercent).toFixed(2)}%`
        : 'N/A',
      tooltip: 'S = Sniper percentage',
    },
    {
      label: 'IN',
      value: data?.insidersHoldPercent
        ? `${Number(data.insidersHoldPercent).toFixed(2)}%`
        : 'N/A',
      tooltip: 'IN = Insider percentage',
    },
    {
      label: 'DEX',
      value: data?.dexPaid
        ? Number(data.dexPaid) === 1
          ? 'Paid'
          : 'Unpaid'
        : 'N/A',
      tooltip: 'DEX = Paid status verified',
      isPaid: true,
    },
  ];

  return (
    <div
      className="border border-[hsl(var(--dashboard-border))] rounded-lg py-3 px-4 relative transition-all duration-300 hover:scale-[1.005]"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)',
      }}
    >
     

      <div
        className={`grid ${
          isExpanded ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'
        } gap-${isExpanded ? '4' : '0'} relative`}
      >
        {metrics.map((metric, index) => (
          <div key={metric.label} className="relative">
            <div
              className="flex items-center justify-center gap-3 py-1 px-4 cursor-pointer transition-opacity duration-200 hover:opacity-80"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {metric.label}
              </div>
              <div className="flex items-center gap-1.5">
                <div className="text-lg font-bold text-foreground">{metric.value}</div>
                {metric.isPaid && metric.value === 'Paid' && (
                  <Check className="w-3.5 h-3.5 text-green-500" />
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
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-black/90 border-r border-b border-[hsl(var(--dashboard-border))]" />
                </div>
              )}
            </div>

            {/* Divider */}
            {index < metrics.length - 1 && (
              <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-[hsl(var(--dashboard-border))]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Token Info Section Using Hook ---
const TokenInfoSection = () => {
  const { data, isLoading, error } = useRealTimeData();
  const [isExpanded, setIsExpanded] = useState(true);

  // Prefer "stats" (from dataResp.axiom) but fallback to tokeninfo
  const metricsData =
    data?.stats || data?.tokeninfo
      ? {
          bundlersHoldPercent:
            data?.stats?.bundlersHoldPercent || data?.tokeninfo?.bndpercentage,
          snipersHoldPercent:
            data?.stats?.snipersHoldPercent || data?.tokeninfo?.snipersHoldPercent,
          top10HoldersPercent:
            data?.stats?.top10HoldersPercent || data?.tokeninfo?.top10,
          insidersHoldPercent:
            data?.stats?.insidersHoldPercent || data?.tokeninfo?.insidersHoldPercent,
          dexPaid: data?.stats?.dexPaid || data?.tokeninfo?.dexPaid,
        }
      : null;

  if (isLoading)
    return (
      <div className="p-4 border border-[hsl(var(--dashboard-border))] rounded-lg animate-pulse bg-black/20">
        <p className="text-muted-foreground text-sm">Loading token metrics...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-4 border border-[hsl(var(--dashboard-border))] rounded-lg">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );

  if (!metricsData)
    return (
      <div className="p-4 border border-[hsl(var(--dashboard-border))] rounded-lg">
        <p className="text-muted-foreground text-sm">No metrics data available.</p>
      </div>
    );

  return (
    <div className="mt-6">
      <HorizontalMetricsBar isExpanded={isExpanded} data={metricsData} />
    </div>
  );
};

export default TokenInfoSection;
