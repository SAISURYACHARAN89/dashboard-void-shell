import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Timeframe = '1M' | '5M' | '15M' | '30M' | '1H' | '4H' | '1D';

interface TradingViewCardProps {
  isExpanded: boolean;
  isLayoutMode: boolean;
  data?: {
    current: {
      marketCapUSD: number;
      marketCapSol: number;
      volumeUSD: number;
      lastUpdated: string;
    };
    history: Array<{
      timestamp: string;
      time: string;
      marketCapUSD: number;
      marketCapSol: number;
      volumeUSD: number;
      priceSol: number;
    }>;
  };
}

const TradingViewCard = ({ isExpanded = false, isLayoutMode = false, data }: TradingViewCardProps) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'k';
    return num.toFixed(2);
  };

  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('5M');
  const handleTimeframeChange = (timeframe: Timeframe) => setActiveTimeframe(timeframe);

  const timeframes: Timeframe[] = isExpanded 
    ? ['1M', '5M', '15M', '30M', '1H', '4H', '1D']
    : ['1M', '5M', '15M', '30M'];

  // ✅ Compute Y-axis ticks with 1000 step
  const yTicks = useMemo(() => {
    if (!data?.history?.length) return [];

    const values = data.history.map((d) => d.marketCapUSD);
    const min = 1000;
    const max = Math.max(...values);

    const step = 1000;
    const start = Math.floor(min / step) * step;
    const end = Math.ceil(max / step) * step;

    const ticks: number[] = [];
    for (let t = start; t <= end; t += step) {
      ticks.push(t);
    }
    return ticks;
  }, [data]);

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-6 flex flex-col h-full transition-all duration-300 hover:scale-[1.01]"
      style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-foreground font-semibold text-lg">
            MBA$ • MC {formatNumber(data?.current?.marketCapUSD || 0)}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isExpanded ? 'Expanded Live Price Chart • Advanced Indicators' : 'Live Price Chart'}
          </p>
        </div>

        {/* Timeframe Toggle */}
        {!isLayoutMode && (
          <div className="hidden md:flex gap-1 bg-[#0A0A0A] rounded-lg p-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTimeframe === tf
                    ? 'bg-[#2A2A2A] text-white'
                    : 'text-[#CCCCCC] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        )}

        {/* Mobile Dropdown */}
        {!isLayoutMode && (
          <select
            value={activeTimeframe}
            onChange={(e) => handleTimeframeChange(e.target.value as Timeframe)}
            className="md:hidden bg-[#0A0A0A] text-white text-xs px-3 py-1.5 rounded-lg border border-[hsl(var(--dashboard-border))] focus:outline-none focus:ring-2 focus:ring-[#2A2A2A]"
          >
            {timeframes.map((tf) => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.history || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis 
              dataKey="time" 
              stroke="#AAAAAA"
              tick={{ fill: '#AAAAAA', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1E1E1E' }}
            />
            <YAxis 
              stroke="#AAAAAA"
              tick={{ fill: '#AAAAAA', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#1E1E1E' }}
              ticks={yTicks}  // ✅ custom ticks here
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#0A0A0A',
                border: '1px solid #1E1E1E',
                borderRadius: '8px',
                color: '#FFFFFF',
              }}
              labelStyle={{ color: '#AAAAAA' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'MarketCap']}
            />
            <Area 
              type="monotone"
              dataKey="marketCapUSD"
              stroke="#FFFFFF"
              strokeWidth={2}
              fill="url(#priceGradient)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TradingViewCard;
