import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users2, Users, UserPlus, Crown, Pencil } from 'lucide-react';
import TimeframeSelector, { Timeframe } from './TimeframeSelector';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface ScatterPlotCardProps {
  isExpanded: boolean;
  isLayoutMode: boolean;
  data?: {
      author_followers: Array<{
          author: string;
          followers: number;
      }>;
  };
}

const ScatterPlotCard = ({ isExpanded = false, isLayoutMode = false, data }: ScatterPlotCardProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [followerAlert, setFollowerAlert] = useState('10000');
  const [minFollowers, setMinFollowers] = useState('1000');

  const authorFollowers = data?.author_followers ?? [];

  // console.log(authorFollowers)

  // Count categories
  let maxCount = 0;
  for (var i = 0; i < authorFollowers.length; i++) {
    if (authorFollowers[i].followers > maxCount) {
      maxCount = authorFollowers[i].followers;
    }
  }
  const miniCount = authorFollowers.filter(f => f.followers < 1000).length;
  const microCount = authorFollowers.filter(f => f.followers >= 1000 && f.followers < 10000).length;
  const macroCount = authorFollowers.filter(f => f.followers >= 10000 && f.followers < 100000).length;
  const largeCount = authorFollowers.filter(f => f.followers >= 100000).length;

  const getFollowerType = (followers: number) => {
    if (followers < 1000) return 'mini';
    if (followers < 10000) return 'micro';
    if (followers < 100000) return 'macro';
    return 'large';
  };

  const getColorByType = (followers: number) => {
    const type = getFollowerType(followers);
    switch (type) {
      case 'mini': return '#8B5CF6';
      case 'micro': return '#3B82F6';
      case 'macro': return '#10B981';
      case 'large': return '#F59E0B';
      default: return '#00FFFF';
    }
  };

  const scatterData = authorFollowers.map((item, index) => ({
  x: index,          // Recharts default X
  followers: item.followers, // Recharts default Y
  author: item.author,
}));
// console.log(scatterData)

  const formatYAxis = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString());

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div
          className="px-4 py-3 rounded-lg animate-fade-in"
          style={{ background: 'rgba(10,10,10,0.95)', border: '1px solid #2ECC71' }}
        >
          <div className="text-white font-bold text-sm mb-1">{point.author}</div>
          <div className="text-white text-xs mb-1">{(point.followers / 1000).toFixed(1)}k followers</div>
          <div className="text-muted-foreground text-xs">{point.followers}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-6 h-full transition-all duration-300 hover:scale-[1.01] relative"
      style={{ background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)' }}
    >
      {!isLayoutMode && (
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); setIsEditOpen(true); }}
            className={`transition-colors ${isSaved ? 'text-[#8A2BE2] hover:text-[#8A2BE2]/80' : 'text-[#AAAAAA] hover:text-white'}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <TimeframeSelector value={timeframe} onChange={setTimeframe} />
        </div>
      )}

      <EditModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Scatter Plot Alerts">
        <div className="space-y-4">
          <div>
            <Label htmlFor="follower-alert" className="text-sm text-muted-foreground">Alert when author with followers exceeds</Label>
            <Input
              id="follower-alert"
              type="number"
              value={followerAlert}
              onChange={e => setFollowerAlert(e.target.value)}
              className="mt-2 bg-[#1A1F2C] border-[#1E1E1E]"
            />
          </div>
          <div>
            <Label htmlFor="min-followers" className="text-sm text-muted-foreground">Minimum follower count filter</Label>
            <Input
              id="min-followers"
              type="number"
              value={minFollowers}
              onChange={e => setMinFollowers(e.target.value)}
              className="mt-2 bg-[#1A1F2C] border-[#1E1E1E]"
            />
          </div>
          <Button className="w-full" onClick={() => { setIsSaved(true); setIsEditOpen(false); }}>Save Changes</Button>
        </div>
      </EditModal>

      <div className="flex flex-col h-full">
        <div className="mb-2">
          <h3 className="text-foreground text-base font-semibold">Follower Concentration</h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            {isExpanded ? 'Extended author distribution by follower count with detailed segmentation' : 'Author distribution by follower count'}
          </p>
        </div>

        <div className="flex-1 min-h-0 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 25, bottom: 5, left: 25 }}>
              <YAxis
                dataKey="followers"
                type="number"
                stroke="#666666"
                tick={{ fill: '#666666', fontSize: 11 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
                tickFormatter={formatYAxis}
                domain={[0, maxCount + maxCount * 0.1]}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#333333' }} />
              <Scatter
                data={scatterData}
                onMouseEnter={(e: any) => setHoveredPoint(e.payload)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {scatterData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={getColorByType(entry.followers)}
                    r={hoveredPoint?.author === entry.author ? 8 : 6}
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Metrics */}
        <div className="flex items-center justify-between gap-3 mt-2 pt-3 border-t border-[hsl(var(--dashboard-border))]">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold text-foreground">{miniCount}</div>
              <div className="text-xs font-medium text-muted-foreground">Mini</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold text-foreground">{microCount}</div>
              <div className="text-xs font-medium text-muted-foreground">Micro</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold text-foreground">{macroCount}</div>
              <div className="text-xs font-medium text-muted-foreground">Macro</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold text-foreground">{largeCount}</div>
              <div className="text-xs font-medium text-muted-foreground">Large</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScatterPlotCard;
