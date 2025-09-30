import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, UserCheck } from 'lucide-react';

const BarGraphSection = () => {
  const [hoveredBar, setHoveredBar] = useState<any>(null);

  // Metrics data
  const memberCount = 1247;
  const memberChangePercent = 12.5;
  const uniqueAuthorsCount = 89;
  const uniqueAuthorsChangePercent = -3.2;

  const chartData = useMemo(() => {
    const timeLabels = ['9:00', '9:15', '9:30', '9:45', '10:00', '10:15', '10:30'];
    return timeLabels.map((time) => ({
      time,
      current: Math.floor(Math.random() * 40 + 30),
      previous: Math.floor(Math.random() * 35 + 25),
    }));
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="px-3 py-2 rounded-lg border border-[hsl(var(--dashboard-border))]"
          style={{ background: 'rgba(0, 0, 0, 0.9)' }}
        >
          <div className="text-white text-xs font-medium mb-1">
            {payload[0].payload.time}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#3498DB' }} />
              <span className="text-white text-xs">Current: {payload[0].value}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#5D6D7E' }} />
              <span className="text-white text-xs">Previous: {payload[1].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-6 h-full transition-all duration-300 hover:border-[hsl(var(--dashboard-border)/0.6)] hover:shadow-sm"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      <div className="flex flex-col h-full">
        {/* Title */}
        <div className="mb-2">
          <h3 className="text-foreground text-base font-semibold">Members vs Unique Authors</h3>
          <p className="text-muted-foreground text-xs mt-0.5">Current vs Previous Refresh</p>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 30, right: 25, bottom: 5, left: 25 }}
              barGap={-10}
            >
              <XAxis 
                dataKey="time"
                stroke="#666666"
                tick={{ fill: '#666666', fontSize: 11 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
              />
              <YAxis 
                stroke="#666666"
                tick={{ fill: '#666666', fontSize: 11 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
                domain={[0, 80]}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              
              {/* Previous refresh bars (semi-transparent) */}
              <Bar 
                dataKey="previous"
                fill="#5D6D7E"
                opacity={0.5}
                radius={[4, 4, 0, 0]}
                onMouseEnter={(data) => setHoveredBar(data)}
                onMouseLeave={() => setHoveredBar(null)}
              />
              
              {/* Current refresh bars (opaque) */}
              <Bar 
                dataKey="current"
                fill="#3498DB"
                radius={[4, 4, 0, 0]}
                label={{
                  position: 'top',
                  fill: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 'bold',
                }}
                onMouseEnter={(data) => setHoveredBar(data)}
                onMouseLeave={() => setHoveredBar(null)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Metrics Section */}
        <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-[hsl(var(--dashboard-border))]">
          {/* Members */}
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">
                  {memberCount.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Members
                </span>
              </div>
              <div 
                className={`text-sm font-semibold ${memberChangePercent > 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}
              >
                {memberChangePercent > 0 ? '+' : ''}{memberChangePercent}%
              </div>
            </div>
          </div>

          {/* Unique Authors */}
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">
                  {uniqueAuthorsCount.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  Unique Authors
                </span>
              </div>
              <div 
                className={`text-sm font-semibold ${uniqueAuthorsChangePercent > 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}
              >
                {uniqueAuthorsChangePercent > 0 ? '+' : ''}{uniqueAuthorsChangePercent}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarGraphSection;
