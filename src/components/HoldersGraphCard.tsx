import { useMemo } from 'react';
import { LineChart, Line, XAxis, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const HoldersGraphCard = () => {
  // Sample data for timeline chart
  const timelineData = useMemo(() => {
    const data = [];
    let base = 50;
    const timeLabels = ['12h', '18h', '24h', '6h', '12h', 'Now'];
    
    for (let i = 0; i < 6; i++) {
      base += Math.random() * 5 + 2; // Upward trend
      data.push({ 
        value: Math.round(base),
        time: timeLabels[i]
      });
    }
    return data;
  }, []);

  const holderCount = 65;
  const percentChange = 8;
  const holderIncrease = 12;
  const isPositive = percentChange > 0;

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-5 h-full"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      <div className="flex items-center gap-6 h-full">
        {/* Left side - Holder info */}
        <div className="flex-1 min-w-0">
          {/* Percentage change */}
          <div className={`flex items-center gap-2 mb-3 ${isPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
            <TrendingUp className={`w-4 h-4 ${!isPositive && 'rotate-180'}`} />
            <span className="text-base font-semibold">
              {isPositive ? '+' : ''}{percentChange}%
            </span>
            <span className="text-sm font-medium">
              {isPositive ? '↑' : '↓'} {holderIncrease}
            </span>
          </div>

          {/* Main holder count */}
          <div>
            <div className="text-foreground text-3xl font-bold mb-1">
              {holderCount}
            </div>
            <div className="text-muted-foreground text-sm">
              Holders
            </div>
          </div>
        </div>

        {/* Right side - Timeline Chart */}
        <div className="w-[45%] h-full flex items-center">
          <ResponsiveContainer width="100%" height="85%">
            <LineChart 
              data={timelineData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis 
                dataKey="time"
                stroke="#333333"
                tick={{ fill: '#666666', fontSize: 10 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
                tickMargin={8}
              />
              <Line 
                type="monotone"
                dataKey="value"
                stroke={isPositive ? '#2ECC71' : '#E74C3C'}
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

export default HoldersGraphCard;
