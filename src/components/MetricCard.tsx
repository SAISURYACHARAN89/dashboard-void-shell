import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, ResponsiveContainer } from 'recharts';
import { Eye, Heart } from 'lucide-react';
import TimeframeSelector, { Timeframe } from './TimeframeSelector';

interface MetricCardProps {
  type: 'views' | 'likes';
  value: number;
  percentChange: number;
  chartColor: string;
  isExpanded?: boolean;
}

const MetricCard = ({ type, value, percentChange, chartColor, isExpanded = false }: MetricCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');

  const chartData = useMemo(() => {
    const data = [];
    const timeLabels = isExpanded 
      ? ['1d', '6h', '12h', '18h', '24h', '6h', '12h', '18h', '24h', 'Now']
      : ['6h', '12h', '18h', '24h', 'Now'];
    
    const baseMultiplier = timeframe === '5m' ? 0.6 : timeframe === '15m' ? 0.65 : 0.7;
    const growthMultiplier = timeframe === '5m' ? 0.02 : timeframe === '15m' ? 0.025 : 0.03;
    
    let base = value * baseMultiplier;
    for (let i = 0; i < timeLabels.length; i++) {
      base += Math.random() * (value * 0.05) + (value * growthMultiplier);
      data.push({ 
        value: Math.round(base),
        time: timeLabels[i]
      });
    }
    return data;
  }, [value, isExpanded, timeframe]);

  const Icon = type === 'views' ? Eye : Heart;
  const label = type === 'views' ? 'Views' : 'Likes';
  const isPositive = percentChange > 0;

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.02] flex flex-col overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Timeframe Selector */}
      <div className="absolute top-5 right-5 z-10">
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      {isExpanded && (
        <div className="mb-4">
          <h3 className="text-foreground text-lg font-semibold">
            {type === 'views' ? 'Views Analytics' : 'Likes Analytics'}
          </h3>
          <p className="text-muted-foreground text-xs mt-1">
            Extended trend history with detailed metrics
          </p>
        </div>
      )}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top section - Icon and Stats */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {value.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
              <div 
                className={`text-sm font-semibold mt-1 ${isPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}
              >
                {isPositive ? '+' : ''}{percentChange}%
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section - Mini Chart */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              key={timeframe}
            >
              <XAxis 
                dataKey="time"
                stroke="#333333"
                tick={{ fill: '#666666', fontSize: 10 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
                tickMargin={6}
              />
              <Line 
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                dot={false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
