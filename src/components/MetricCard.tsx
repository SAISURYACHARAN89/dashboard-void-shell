import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, ResponsiveContainer } from 'recharts';
import { Eye, Heart } from 'lucide-react';

interface MetricCardProps {
  type: 'views' | 'likes';
  value: number;
  percentChange: number;
  chartColor: string;
}

const MetricCard = ({ type, value, percentChange, chartColor }: MetricCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const chartData = useMemo(() => {
    const data = [];
    const timeLabels = ['6h', '12h', '18h', '24h', 'Now'];
    let base = value * 0.6;
    for (let i = 0; i < 5; i++) {
      base += Math.random() * (value * 0.05) + (value * 0.02);
      data.push({ 
        value: Math.round(base),
        time: timeLabels[i]
      });
    }
    return data;
  }, [value]);

  const Icon = type === 'views' ? Eye : Heart;
  const label = type === 'views' ? 'Views' : 'Likes';
  const isPositive = percentChange > 0;

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-xl p-5 h-full transition-all duration-300 hover:border-[hsl(var(--dashboard-border))]/60 hover:shadow-lg group"
      style={{
        background: isHovered 
          ? 'linear-gradient(135deg, rgba(21, 21, 21, 0.9) 0%, rgba(24, 24, 24, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(13, 13, 13, 0.8) 0%, rgba(18, 18, 18, 0.9) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: isHovered 
          ? '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col h-full">
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
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
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
