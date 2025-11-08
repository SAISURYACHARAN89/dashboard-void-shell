import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import { Users, UserCheck, Pencil } from 'lucide-react';
import TimeframeSelector, { Timeframe } from './TimeframeSelector';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import dayjs from 'dayjs';

interface BarGraphSectionProps {
  isExpanded: boolean;
  isLayoutMode: boolean;
  data?: {
    marketCap?: any;
    holders?: any;
    buysSells?: any;
    social?: any;
    walletAge?: any;
    metrics?: any;
    lastUpdate?: string;
  };
}

const BarGraphSection = ({ isExpanded = false, isLayoutMode = false, data }: BarGraphSectionProps) => {
  const [hoveredBar, setHoveredBar] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [barThreshold, setBarThreshold] = useState('100');
  const [dataInterval, setDataInterval] = useState('minutes');
  const [showMLine, setShowMLine] = useState(true);
  const [showCLine, setShowCLine] = useState(true);

  // Metrics from backend
  const memberCount = data?.metrics?.memberCount ?? 0;
  const uniqueAuthorsCount = data?.metrics?.uniqueAuthors ?? 0;
  const memberChangePercent = data?.metrics?.memberChangePercent ?? 0;
  const uniqueAuthorsChangePercent = data?.metrics?.uniqueAuthorsChangePercent ?? 0;

  // Chart data
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalPostsData, setTotalPostsData] = useState<any[]>([]);

  // Append live metrics to chart data
  useEffect(() => {
    if (!data?.metrics?.lastUpdated) return;
    const newPoint = {
      time: dayjs(data.metrics.lastUpdated).format('HH:mm:ss'),
      memberCount: Number(memberCount),
      uniqueAuthors: Number(uniqueAuthorsCount),
    };
    setChartData((prev) => {
      const last = prev[prev.length - 1];
      if (last &&
        last.memberCount === newPoint.memberCount &&
        last.uniqueAuthors === newPoint.uniqueAuthors
      ) return prev;
      const updated = [...prev, newPoint];
      if (updated.length > 20) updated.shift();
      return updated;
    });
  }, [data?.metrics?.lastUpdated, memberCount, uniqueAuthorsCount]);

  // Simulate total posts data (until backend adds it)
  useEffect(() => {
    const now = dayjs().format('HH:mm');
    setTotalPostsData((prev) => {
      const newPoint = {
        time: now,
        total: Math.max(10, (prev[prev.length - 1]?.total ?? 15) + Math.floor(Math.random() * 3 - 1)),
        m: Math.max(5, (prev[prev.length - 1]?.m ?? 8) + Math.floor(Math.random() * 2 - 0.5)),
        c: Math.max(8, (prev[prev.length - 1]?.c ?? 12) + Math.floor(Math.random() * 2 - 0.5)),
      };
      const updated = [...prev, newPoint];
      if (updated.length > 20) updated.shift();
      return updated;
    });
  }, [data?.metrics?.lastUpdated]);

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
              <div className="w-2 h-2 rounded-full bg-white" />
              <span className="text-white text-xs">Members: {payload[0].value}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-white text-xs">Unique Authors: {payload[1].value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-6 h-full transition-all duration-300 hover:scale-[1.01] relative"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)',
      }}
    >
      {/* Edit + Timeframe Selector */}
      {!isLayoutMode && (
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
      )}

      <EditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Bar Graph Settings"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="bar-threshold" className="text-sm text-muted-foreground">
              Alert when bar exceeds value
            </Label>
            <Input
              id="bar-threshold"
              type="number"
              value={barThreshold}
              onChange={(e) => setBarThreshold(e.target.value)}
              className="mt-2 bg-[#1A1F2C] border-[#1E1E1E]"
            />
          </div>
          <div>
            <Label htmlFor="data-interval" className="text-sm text-muted-foreground">
              Data interval
            </Label>
            <Select value={dataInterval} onValueChange={setDataInterval}>
              <SelectTrigger className="mt-2 bg-[#1A1F2C] border-[#1E1E1E]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Minutes</SelectItem>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={() => { setIsSaved(true); setIsEditOpen(false); }}>
            Save Changes
          </Button>
        </div>
      </EditModal>

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-2">
          <h3 className="text-foreground text-base font-semibold">Members vs Unique Authors</h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            {isExpanded ? 'Extended historical comparison with detailed refresh data' : 'Time series of refreshes'}
          </p>
        </div>

        {/* Charts */}
        <div className={`flex-1 min-h-0 flex gap-4 ${isExpanded ? '' : 'flex-col'}`}>
          {/* Main Bar Chart */}
          <div className={`${isExpanded ? 'w-[70%]' : 'flex-1'} min-h-0`}>
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
                />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey="uniqueAuthors" fill="#808080" opacity={0.5} radius={[4, 4, 0, 0]} />
                <Bar dataKey="memberCount" fill="#FFFFFF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Total Posts Chart (only when expanded) */}
          {isExpanded && (
            <div className="w-[30%] min-h-0 border-l border-[hsl(var(--dashboard-border))] pl-4 flex flex-col shrink-0">
              <div className="mb-3 flex-shrink-0">
                <h4 className="text-foreground text-sm font-semibold mb-2">Total Posts</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMLine(!showMLine); }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      showMLine
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500'
                        : 'bg-[#1C1C1C] text-muted-foreground border border-[#2A2A2A]'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowCLine(!showCLine); }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      showCLine
                        ? 'bg-green-500/20 text-green-400 border border-green-500'
                        : 'bg-[#1C1C1C] text-muted-foreground border border-[#2A2A2A]'
                    }`}
                  >
                    C
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={totalPostsData}>
                    <XAxis
                      dataKey="time"
                      stroke="#333333"
                      tick={{ fill: '#666666', fontSize: 9 }}
                      tickLine={{ stroke: '#333333' }}
                      axisLine={{ stroke: '#333333' }}
                    />
                    <YAxis
                      stroke="#333333"
                      tick={{ fill: '#666666', fontSize: 9 }}
                      tickLine={{ stroke: '#333333' }}
                      axisLine={{ stroke: '#333333' }}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.9)',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#666666' }}
                    />
                    <Line dataKey="total" stroke="#B0B0B0" strokeWidth={2} dot={{ fill: '#B0B0B0', r: 2 }} />
                    {showMLine && <Line dataKey="m" stroke="#60A5FA" strokeWidth={2} dot={{ fill: '#60A5FA', r: 2 }} />}
                    {showCLine && <Line dataKey="c" stroke="#4ADE80" strokeWidth={2} dot={{ fill: '#4ADE80', r: 2 }} />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="grid grid-cols-3 gap-4 mt-2 pt-3 border-t border-[hsl(var(--dashboard-border))]">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">{memberCount.toLocaleString()}</span>
                <span className="text-xs font-medium text-muted-foreground">Members</span>
              </div>
              <div className={`text-sm font-semibold ${memberChangePercent > 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                {memberChangePercent > 0 ? '+' : ''}{memberChangePercent}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">{uniqueAuthorsCount.toLocaleString()}</span>
                <span className="text-xs font-medium text-muted-foreground">Unique Authors</span>
              </div>
              <div className={`text-sm font-semibold ${uniqueAuthorsChangePercent > 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                {uniqueAuthorsChangePercent > 0 ? '+' : ''}{uniqueAuthorsChangePercent}%
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">
                  {totalPostsData[totalPostsData.length - 1]?.total ?? 0}
                </span>
                <span className="text-xs font-medium text-muted-foreground">Total Posts</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span>M : <span className="text-blue-400 font-semibold">{totalPostsData.at(-1)?.m ?? 0}</span></span>
                <span>C : <span className="text-green-400 font-semibold">{totalPostsData.at(-1)?.c ?? 0}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarGraphSection;
