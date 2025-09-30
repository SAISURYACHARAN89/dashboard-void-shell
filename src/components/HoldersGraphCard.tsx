import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const HoldersGraphCard = () => {
  // Sample data for sparkline
  const sparklineData = useMemo(() => {
    const data = [];
    let base = 50;
    for (let i = 0; i < 20; i++) {
      base += Math.random() * 3 - 1;
      data.push({ value: base });
    }
    return data;
  }, []);

  const holderCount = 65;
  const percentChange = 8;
  const holderIncrease = 12;
  const isPositive = percentChange > 0;

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-4 h-full"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      <div className="flex items-center justify-between h-full">
        {/* Left side - Holder info */}
        <div className="flex-1">
          {/* Percentage change */}
          <div className={`flex items-center gap-1.5 mb-2 ${isPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
            <TrendingUp className={`w-3.5 h-3.5 ${!isPositive && 'rotate-180'}`} />
            <span className="text-sm font-medium">
              {isPositive ? '+' : ''}{percentChange}%
            </span>
            <span className="text-xs">
              {isPositive ? '↑' : '↓'} {holderIncrease}
            </span>
          </div>

          {/* Main holder count */}
          <div>
            <div className="text-foreground text-2xl font-bold mb-1">
              {holderCount}
            </div>
            <div className="text-muted-foreground text-xs">
              Holders
            </div>
          </div>
        </div>

        {/* Right side - Sparkline */}
        <div className="w-24 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
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
