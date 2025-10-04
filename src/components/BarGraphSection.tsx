import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
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

  // Metrics data
  const memberCount = data?.metrics?.memberCount ?? 0;
  const uniqueAuthorsCount = data?.metrics?.uniqueAuthors ?? 0;

  const memberChangePercent = data?.metrics?.memberChangePercent ?? 0;
  const uniqueAuthorsChangePercent = data?.metrics?.uniqueAuthorsChangePercent ?? 0;

  // ✅ Chart data state to keep series history
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
  if (!data?.metrics?.lastUpdated) return;

  const newPoint = {
    time: dayjs(data.metrics.lastUpdated).format('HH:mm:ss'),
    memberCount: Number(memberCount),
    uniqueAuthors: Number(uniqueAuthorsCount),
  };

  setChartData((prev) => {
    // If last point exists and values are identical, skip adding
    const last = prev[prev.length - 1];
    if (last &&
        last.memberCount === newPoint.memberCount &&
        last.uniqueAuthors === newPoint.uniqueAuthors
    ) return prev;

    const updated = [...prev, newPoint];

    // Optional: keep only last 20 points
    if (updated.length > 20) updated.shift();

    return updated;
  });
}, [data?.metrics?.lastUpdated, memberCount, uniqueAuthorsCount]);

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
              <div className="w-2 h-2 rounded-full" style={{ background: '#FFFFFF' }} />
              <span className="text-white text-xs">Members: {payload[0].value}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#808080' }} />
              <span className="text-white text-xs">Unique authors: {payload[1].value}</span>
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
        <div className="mb-2">
          <h3 className="text-foreground text-base font-semibold">Members vs Unique Authors</h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            {isExpanded ? 'Extended historical comparison with detailed refresh data' : 'Time series of refreshes'}
          </p>
        </div>

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
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Bar dataKey="memberCount" fill="#ffffff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="uniqueAuthors" fill="#808080" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2 pt-3 border-t border-[hsl(var(--dashboard-border))]">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-foreground">
                  {memberCount.toLocaleString()}
                </span>
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
                <span className="text-xl font-bold text-foreground">
                  {uniqueAuthorsCount.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-muted-foreground">Unique Authors</span>
              </div>
              <div className={`text-sm font-semibold ${uniqueAuthorsChangePercent > 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
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
