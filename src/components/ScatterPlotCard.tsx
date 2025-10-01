import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users2, Users, UserPlus, Crown, Pencil } from 'lucide-react';
import TimeframeSelector, { Timeframe } from './TimeframeSelector';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface DataPoint {
  time: string;
  followers: number;
  author: string;
  timestamp: string;
}

interface ScatterPlotCardProps {
  isExpanded?: boolean;
}

const ScatterPlotCard = ({ isExpanded = false }: ScatterPlotCardProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [followerAlert, setFollowerAlert] = useState('10000');
  const [minFollowers, setMinFollowers] = useState('1000');

  // Follower segment counts
  const miniCount = 324; // <1k followers
  const microCount = 127; // 1k-10k followers  
  const macroCount = 45; // 10k-100k followers
  const largeCount = 12; // >100k followers

  const getFollowerType = (followers: number): string => {
    if (followers < 1000) return 'mini';
    if (followers < 10000) return 'micro';
    if (followers < 100000) return 'macro';
    return 'large';
  };

  const getColorByType = (followers: number): string => {
    const type = getFollowerType(followers);
    switch (type) {
      case 'mini': return '#8B5CF6'; // Purple
      case 'micro': return '#3B82F6'; // Blue
      case 'macro': return '#10B981'; // Green
      case 'large': return '#F59E0B'; // Amber
      default: return '#00FFFF';
    }
  };

  const scatterData = useMemo(() => {
    const data: DataPoint[] = [];
    const times = isExpanded
      ? ['8:00', '8:30', '9:00', '9:15', '9:30', '9:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:30']
      : ['9:00', '9:15', '9:30', '9:45', '10:00', '10:15', '10:30', '10:45'];
    const authors = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry', 'Ivan', 'Julia', 'Kevin', 'Luna'];
    
    // Generate random scatter points based on timeframe
    const basePointCount = isExpanded ? 120 : 50;
    const pointMultiplier = timeframe === '5m' ? 1 : timeframe === '15m' ? 1.3 : 1.6;
    const pointCount = Math.round(basePointCount * pointMultiplier);
    
    for (let i = 0; i < pointCount; i++) {
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
  }, [isExpanded, timeframe]);

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
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-6 h-full transition-all duration-300 hover:scale-[1.01] relative"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      {/* Edit Button & Timeframe Selector */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditOpen(true);
          }}
          className={`transition-colors ${isSaved ? 'text-[#8A2BE2] hover:text-[#8A2BE2]/80' : 'text-[#AAAAAA] hover:text-white'}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      <EditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Scatter Plot Alerts"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="follower-alert" className="text-sm text-muted-foreground">
              Alert when author with followers exceeds
            </Label>
            <Input
              id="follower-alert"
              type="number"
              value={followerAlert}
              onChange={(e) => setFollowerAlert(e.target.value)}
              className="mt-2 bg-[#1A1F2C] border-[#1E1E1E]"
            />
          </div>
          <div>
            <Label htmlFor="min-followers" className="text-sm text-muted-foreground">
              Minimum follower count filter
            </Label>
            <Input
              id="min-followers"
              type="number"
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value)}
              className="mt-2 bg-[#1A1F2C] border-[#1E1E1E]"
            />
          </div>
          <Button className="w-full" onClick={() => { setIsSaved(true); setIsEditOpen(false); }}>
            Save Changes
          </Button>
        </div>
      </EditModal>

      <div className="flex flex-col h-full">
        {/* Title */}
        <div className="mb-2">
          <h3 className="text-foreground text-base font-semibold">Follower Concentration</h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            {isExpanded ? 'Extended author distribution by follower count with detailed segmentation' : 'Author distribution by follower count'}
          </p>
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
                    fill={getColorByType(entry.followers)}
                    opacity={0.8}
                    r={hoveredPoint === entry ? 2 : 0.8}
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
