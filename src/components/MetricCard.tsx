import { useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
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
    let base = value * 0.6;
    for (let i = 0; i < 12; i++) {
      base += Math.random() * (value * 0.05) + (value * 0.02);
      data.push({ value: Math.round(base) });
    }
    return data;
  }, [value]);

  const Icon = type === 'views' ? Eye : Heart;
  const label = type === 'views' ? 'Views' : 'Likes';
  const isPositive = percentChange > 0;

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-5 h-full transition-colors duration-200"
      style={{
        background: isHovered 
          ? 'linear-gradient(180deg, #151515 0%, #181818 100%)'
          : 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
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
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
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
