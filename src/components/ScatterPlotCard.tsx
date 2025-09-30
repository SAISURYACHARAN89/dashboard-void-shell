import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users2, Users, UserPlus, Crown } from 'lucide-react';

interface DataPoint {
  time: string;
  followers: number;
  author: string;
  timestamp: string;
}

const ScatterPlotCard = () => {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  // Follower segment counts
  const miniCount = 324; // <1k followers
  const microCount = 127; // 1k-10k followers  
  const macroCount = 45; // 10k-100k followers
  const largeCount = 12; // >100k followers

  const scatterData = useMemo(() => {
    const data: DataPoint[] = [];
    const times = ['9:00', '9:15', '9:30', '9:45', '10:00', '10:15', '10:30', '10:45'];
    const authors = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    
    // Generate random scatter points
    for (let i = 0; i < 50; i++) {
      const timeIndex = Math.floor(Math.random() * times.length);
      const authorIndex = Math.floor(Math.random() * authors.length);
      data.push({
        time: times[timeIndex],
        followers: Math.floor(Math.random() * 45000) + 1000,
        author: authors[authorIndex],
        timestamp: `${times[timeIndex]} • Sept 29`
      });
    }
    return data;
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length && hoveredPoint) {
      return (
        <div 
          className="px-4 py-3 rounded-lg animate-fade-in"
          style={{ 
            background: 'rgba(10, 10, 10, 0.95)',
            border: '1px solid #2ECC71'
          }}
        >
          <div className="text-white font-bold text-sm mb-1">
            {hoveredPoint.author}
          </div>
          <div className="text-white text-xs mb-1">
            {(hoveredPoint.followers / 1000).toFixed(1)}k followers
          </div>
          <div className="text-muted-foreground text-xs">
            {hoveredPoint.timestamp}
          </div>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-6 h-full transition-all duration-300 hover:border-[hsl(var(--accent-neon-blue)/0.25)]"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)',
        boxShadow: '0 0 1px hsl(var(--accent-neon-blue) / 0.08)'
      }}
    >
      <div className="flex flex-col h-full">
        {/* Title */}
        <div className="mb-2">
          <h3 className="text-foreground text-base font-semibold">Follower Concentration</h3>
          <p className="text-muted-foreground text-xs mt-0.5">Author distribution by follower count</p>
        </div>

        {/* Scatter Plot */}
        <div className="flex-1 min-h-0 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 10, right: 25, bottom: 5, left: 25 }}
            >
              <XAxis 
                dataKey="time"
                type="category"
                allowDuplicatedCategory={false}
                stroke="#666666"
                tick={{ fill: '#666666', fontSize: 11 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
              />
              <YAxis 
                dataKey="followers"
                type="number"
                stroke="#666666"
                tick={{ fill: '#666666', fontSize: 11 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
                tickFormatter={formatYAxis}
                domain={[0, 50000]}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ strokeDasharray: '3 3', stroke: '#333333' }}
              />
              <Scatter
                data={scatterData}
                fill="#00FFFF"
                onMouseEnter={(data) => setHoveredPoint(data as DataPoint)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill="#00FFFF"
                    opacity={0.7}
                    r={hoveredPoint === entry ? 6 : 2}
                    style={{ 
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Metrics Section */}
        <div className="flex items-center justify-between gap-3 mt-2 pt-3 border-t border-[hsl(var(--dashboard-border))]">
          {/* Mini (<1k) */}
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold text-foreground">
                {miniCount}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Mini
              </div>
            </div>
          </div>

          {/* Micro (1k-10k) */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold text-foreground">
                {microCount}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Micro
              </div>
            </div>
          </div>

          {/* Macro (10k-100k) */}
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold text-foreground">
                {macroCount}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Macro
              </div>
            </div>
          </div>

          {/* Large (>100k) */}
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold text-foreground">
                {largeCount}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Large
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScatterPlotCard;
