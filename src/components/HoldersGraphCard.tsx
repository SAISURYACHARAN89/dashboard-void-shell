import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

interface HoldersGraphCardProps {
  isExpanded?: boolean;
}

const HoldersGraphCard = ({ isExpanded = false }: HoldersGraphCardProps) => {
  // Sample data for timeline chart
  const timelineData = useMemo(() => {
    const data = [];
    let base = 50;
    const timeLabels = isExpanded 
      ? ['1d', '6h', '12h', '18h', '24h', '6h', '12h', '18h', '24h', 'Now']
      : ['12h', '18h', '24h', '6h', '12h', 'Now'];
    
    for (let i = 0; i < timeLabels.length; i++) {
      base += Math.random() * 5 + 2; // Upward trend
      data.push({ 
        value: Math.round(base),
        time: timeLabels[i]
      });
    }
    return data;
  }, [isExpanded]);

  const holderCount = 65;
  const percentChange = 8;
  const holderIncrease = 12;
  const isPositive = percentChange > 0;

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.01]"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      <div className={`flex ${isExpanded ? 'flex-col' : 'items-center'} gap-6 h-full`}>
        {/* Holder info */}
        <div className={`${isExpanded ? 'w-full' : 'flex-1 min-w-0'}`}>
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
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-muted-foreground" />
            <div>
              <div className="text-foreground text-3xl font-bold mb-1">
                {holderCount}
              </div>
              <div className="text-muted-foreground text-sm">
                {isExpanded ? 'Total Holders • Updated 2m ago' : 'Holders'}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className={`${isExpanded ? 'w-full flex-1' : 'w-[45%] h-full'} flex items-center`}>
          <ResponsiveContainer width="100%" height={isExpanded ? '100%' : '85%'}>
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
              {isExpanded && (
                <YAxis 
                  stroke="#333333"
                  tick={{ fill: '#666666', fontSize: 10 }}
                  tickLine={{ stroke: '#333333' }}
                  axisLine={{ stroke: '#333333' }}
                />
              )}
              {isExpanded && (
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0A0A',
                    border: '1px solid #2ECC71',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#666666' }}
                />
              )}
              <Line 
                type="monotone"
                dataKey="value"
                stroke="#B0B0B0"
                strokeWidth={2}
                dot={isExpanded}
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
