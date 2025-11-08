import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Globe } from 'lucide-react';

type Timeframe = '1M' | '5M' | '15M' | '30M' | '1H' | '4H' | '1D' | '∞';

const TIMEZONES = [
  { label: 'UTC-12:00 Baker Island', value: 'Etc/GMT+12' },
  { label: 'UTC-11:00 American Samoa', value: 'Pacific/Pago_Pago' },
  { label: 'UTC-10:00 Hawaii', value: 'Pacific/Honolulu' },
  { label: 'UTC-09:00 Alaska', value: 'America/Anchorage' },
  { label: 'UTC-08:00 Pacific Time (Los Angeles)', value: 'America/Los_Angeles' },
  { label: 'UTC-07:00 Mountain Time (Denver)', value: 'America/Denver' },
  { label: 'UTC-06:00 Central Time (Chicago)', value: 'America/Chicago' },
  { label: 'UTC-05:00 Eastern Time (New York)', value: 'America/New_York' },
  { label: 'UTC-04:00 Atlantic Time (Halifax)', value: 'America/Halifax' },
  { label: 'UTC-03:30 Newfoundland', value: 'America/St_Johns' },
  { label: 'UTC-03:00 Brazil (São Paulo)', value: 'America/Sao_Paulo' },
  { label: 'UTC-02:00 Mid-Atlantic', value: 'Atlantic/South_Georgia' },
  { label: 'UTC-01:00 Azores', value: 'Atlantic/Azores' },
  { label: 'UTC+00:00 London (GMT)', value: 'Europe/London' },
  { label: 'UTC+01:00 Paris (CET)', value: 'Europe/Paris' },
  { label: 'UTC+02:00 Cairo', value: 'Africa/Cairo' },
  { label: 'UTC+03:00 Moscow', value: 'Europe/Moscow' },
  { label: 'UTC+03:30 Tehran', value: 'Asia/Tehran' },
  { label: 'UTC+04:00 Dubai', value: 'Asia/Dubai' },
  { label: 'UTC+04:30 Kabul', value: 'Asia/Kabul' },
  { label: 'UTC+05:00 Karachi', value: 'Asia/Karachi' },
  { label: 'UTC+05:30 India (Mumbai)', value: 'Asia/Kolkata' },
  { label: 'UTC+05:45 Nepal', value: 'Asia/Kathmandu' },
  { label: 'UTC+06:00 Bangladesh', value: 'Asia/Dhaka' },
  { label: 'UTC+06:30 Myanmar', value: 'Asia/Yangon' },
  { label: 'UTC+07:00 Bangkok', value: 'Asia/Bangkok' },
  { label: 'UTC+08:00 Singapore', value: 'Asia/Singapore' },
  { label: 'UTC+08:45 Eucla', value: 'Australia/Eucla' },
  { label: 'UTC+09:00 Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'UTC+09:30 Adelaide', value: 'Australia/Adelaide' },
  { label: 'UTC+10:00 Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'UTC+10:30 Lord Howe Island', value: 'Australia/Lord_Howe' },
  { label: 'UTC+11:00 Solomon Islands', value: 'Pacific/Guadalcanal' },
  { label: 'UTC+12:00 Auckland (NZST)', value: 'Pacific/Auckland' },
  { label: 'UTC+12:45 Chatham Islands', value: 'Pacific/Chatham' },
  { label: 'UTC+13:00 Tonga', value: 'Pacific/Tongatapu' },
  { label: 'UTC+14:00 Line Islands', value: 'Pacific/Kiritimati' },
];

interface TradingViewCardProps {
  isExpanded?: boolean;
  isLayoutMode?: boolean;
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
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('5M');
  const [selectedTimezone, setSelectedTimezone] = useState('Europe/London');
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
  const [isTimeframeOpen, setIsTimeframeOpen] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'k';
    return num.toFixed(2);
  };

  // ✅ Generate sample chart data if no backend data
  const chartData = useMemo(() => {
    if (data?.history?.length) return data.history;
    const points = [];
    let base = 0.0035;
    const now = Date.now();
    for (let i = 0; i < 60; i++) {
      base += (Math.random() - 0.5) * 0.0001;
      const t = new Date(now - (60 - i) * 60000);
      points.push({
        time: t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        marketCapUSD: base * 100000,
      });
    }
    return points;
  }, [data, activeTimeframe]);

  const yTicks = useMemo(() => {
    const values = chartData.map((d) => d.marketCapUSD);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / 5;
    const ticks: number[] = [];
    for (let t = min; t <= max; t += step) ticks.push(t);
    return ticks;
  }, [chartData]);

  const timeframes: Timeframe[] = isExpanded 
    ? ['1M', '5M', '15M', '30M', '1H', '4H', '1D', '∞']
    : ['1M', '5M', '15M', '30M', '1H'];

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-6 flex flex-col h-full transition-all duration-300 hover:scale-[1.01]"
      style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-foreground font-semibold text-lg">
            MBA$ • MC {formatNumber(data?.current?.marketCapUSD || chartData.at(-1)?.marketCapUSD || 0)}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {isExpanded ? 'Expanded Live Price Chart • Advanced Indicators' : 'Live Price Chart'}
          </p>
        </div>

        {/* Timeframe + Timezone Selectors */}
        {!isLayoutMode && (
          <div className="flex items-center gap-2">
            {/* Timeframe Selector */}
            <div className="relative">
              <button
                onClick={() => setIsTimeframeOpen(!isTimeframeOpen)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2A2A2A] text-white hover:bg-[#333333] transition-colors"
              >
                {activeTimeframe}
              </button>

              {isTimeframeOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTimeframeOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg shadow-lg overflow-hidden z-50">
                    {timeframes.map((tf) => (
                      <button
                        key={tf}
                        onClick={() => {
                          setActiveTimeframe(tf);
                          setIsTimeframeOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-xs font-medium text-left transition-colors ${
                          activeTimeframe === tf
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

            {/* Timezone Selector */}
            <div className="relative">
              <button
                onClick={() => setIsTimezoneOpen(!isTimezoneOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A0A0A] text-white text-xs font-medium hover:bg-[#2A2A2A] transition-colors border border-[hsl(var(--dashboard-border))]"
              >
                <Globe className="w-3.5 h-3.5" />
                {TIMEZONES.find(tz => tz.value === selectedTimezone)?.label.split(' ')[0] || 'UTC'}
              </button>

              {isTimezoneOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTimezoneOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg shadow-lg overflow-hidden z-50 min-w-[280px] max-h-[400px] overflow-y-auto">
                    {TIMEZONES.map((tz) => (
                      <button
                        key={tz.value}
                        onClick={() => {
                          setSelectedTimezone(tz.value);
                          setIsTimezoneOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-xs font-medium text-left transition-colors ${
                          selectedTimezone === tz.value
                            ? 'bg-[#2A2A2A] text-white'
                            : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'
                        }`}
                      >
                        {tz.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              ticks={yTicks}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#0A0A0A',
                border: '1px solid #1E1E1E',
                borderRadius: '8px',
                color: '#FFFFFF',
              }}
              labelStyle={{ color: '#AAAAAA' }}
              formatter={(value: number) => [`$${value.toFixed(4)}`, 'MarketCap']}
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
