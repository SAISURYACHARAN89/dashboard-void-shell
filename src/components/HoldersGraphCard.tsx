import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Users, Pencil, RefreshCw } from 'lucide-react';
import TimeframeSelector, { Timeframe } from './TimeframeSelector';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface HoldersGraphCardProps {
  isExpanded: boolean;
  isLayoutMode: boolean;
  data?: {
    current: {
      holderCount: number;
      percentChange: number;
      holderIncrease: number;
      lastUpdated: string;
      walletAgeDistribution: Record<string, number>;
      totalHolders: number;
    };
    history: Array<{
      timestamp: string;
      time: string;
      value: number;
      marketCap: number;
      uniqueAuthors: number;
      totalViews: number;
    }>;
    timeline: Array<any>;
  };
}

const HoldersGraphCard = ({ isExpanded = false, isLayoutMode = false, data }: HoldersGraphCardProps) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState('5');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use real data from props
  const currentData = data?.current || {
    holderCount: 0,
    percentChange: 0,
    holderIncrease: 0,
    lastUpdated: '',
    walletAgeDistribution: { baby: 0, adult: 0, old: 0 },
    totalHolders: 0
  };

  const historyData = data?.history || [];

  const { holderCount, percentChange, holderIncrease, lastUpdated, walletAgeDistribution, totalHolders } = currentData;
  const isPositive = percentChange > 0;

  // Process chart data based on timeframe and real data
  const chartData = useMemo(() => {
    if (!historyData.length) {
      // Fallback to mock data if no real data
      const mockData = [];
      let base = timeframe === '5m' ? 50 : timeframe === '15m' ? 55 : 60;
      const timeLabels = isExpanded 
        ? ['1d', '6h', '12h', '18h', '24h', '6h', '12h', '18h', '24h', 'Now']
        : ['12h', '18h', '24h', '6h', '12h', 'Now'];
      
      const growthRate = timeframe === '5m' ? 2 : timeframe === '15m' ? 3 : 4;
      for (let i = 0; i < timeLabels.length; i++) {
        base += Math.random() * 5 + growthRate;
        mockData.push({ 
          value: Math.round(base),
          time: timeLabels[i]
        });
      }
      return mockData;
    }

    // Use real historical data
    const data = [...historyData];
    
    // Filter based on timeframe
    switch (timeframe) {
      case '5m':
        return data.slice(-20); // Last 20 data points
      case '15m':
        return data.slice(-30); // Last 30 data points
      case '1h':
        return data.slice(-50); // Last 50 data points
      default:
        return data;
    }
  }, [historyData, timeframe, isExpanded]);

  // Format last updated time
  const formatLastUpdated = (timestamp: string) => {
    if (!timestamp) return 'Never';
    
    try {
      const now = new Date();
      const updated = new Date(timestamp);
      const diffMs = now.getTime() - updated.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 min ago';
      if (diffMins < 60) return `${diffMins} mins ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return '1 day ago';
      return `${diffDays} days ago`;
    } catch {
      return 'Unknown';
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    // This would typically trigger a data refetch from the parent
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Calculate additional metrics for expanded view
  const walletAgeMetrics = useMemo(() => {
    const total = walletAgeDistribution.baby + walletAgeDistribution.adult + walletAgeDistribution.old;
    if (total === 0) return { baby: 0, adult: 0, old: 0 };
    
    return {
      baby: Math.round((walletAgeDistribution.baby / total) * 100),
      adult: Math.round((walletAgeDistribution.adult / total) * 100),
      old: Math.round((walletAgeDistribution.old / total) * 100)
    };
  }, [walletAgeDistribution]);

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-5 h-full transition-all duration-300 hover:scale-[1.01] relative"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      {/* Edit Button & Timeframe Selector */}
      {!isLayoutMode && (
        <div className="absolute top-5 right-5 z-10 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditOpen(true);
            }}
            className={`transition-colors ${isSaved ? 'text-[#8A2BE2] hover:text-[#8A2BE2]/80' : 'text-[#AAAAAA] hover:text-white'}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-[#AAAAAA] hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <TimeframeSelector value={timeframe} onChange={setTimeframe} />
        </div>
      )}

      <EditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Holders Alerts"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="holder-alert" className="text-sm text-muted-foreground">
              Alert when holder count changes by (%)
            </Label>
            <Input
              id="holder-alert"
              type="number"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="mt-2 bg-[#1A1F2C] border-[#1E1E1E]"
            />
          </div>
          <div>
            <Label htmlFor="custom-tf" className="text-sm text-muted-foreground">
              Custom Timeframe Filter
            </Label>
            <Input
              id="custom-tf"
              type="text"
              placeholder="e.g., 7d, 30d"
              className="mt-2 bg-[#1A1F2C] border-[#1E1E1E]"
            />
          </div>
          <Button className="w-full" onClick={() => { setIsSaved(true); setIsEditOpen(false); }}>
            Save Changes
          </Button>
        </div>
      </EditModal>

      <div className={`flex ${isExpanded ? 'flex-col' : 'items-center'} gap-6 h-full pt-12`}>
        {/* Holder info */}
        <div className={`${isExpanded ? 'w-full' : 'flex-1 min-w-0'}`}>
          {/* Percentage change */}
          <div className={`flex items-center gap-2 mb-3 ${isPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
            <TrendingUp className={`w-4 h-4 ${!isPositive && 'rotate-180'}`} />
            <span className="text-base font-semibold">
              {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
            </span>
            <span className="text-sm font-medium">
              {isPositive ? '↑' : '↓'} {Math.abs(holderIncrease)}
            </span>
          </div>

          {/* Main holder count */}
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-muted-foreground" />
            <div>
              <div className="text-foreground text-3xl font-bold mb-1">
                {holderCount.toLocaleString()}
              </div>
              <div className="text-muted-foreground text-sm">
                {isExpanded ? `Total Holders • Updated ${formatLastUpdated(lastUpdated)}` : 'Holders'}
              </div>
            </div>
          </div>

          {/* Additional info when expanded */}
          {isExpanded && (
            <div className="mt-6 space-y-4">
              {/* Wallet Age Distribution */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Wallet Age Distribution</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-[#1A1F2C] rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">{walletAgeDistribution.baby}</div>
                    <div className="text-xs text-muted-foreground">Baby ({walletAgeMetrics.baby}%)</div>
                    <div className="text-xs text-blue-400 mt-1">≤ 30 days</div>
                  </div>
                  <div className="text-center p-3 bg-[#1A1F2C] rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{walletAgeDistribution.adult}</div>
                    <div className="text-xs text-muted-foreground">Adult ({walletAgeMetrics.adult}%)</div>
                    <div className="text-xs text-green-400 mt-1">1-6 months</div>
                  </div>
                  <div className="text-center p-3 bg-[#1A1F2C] rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">{walletAgeDistribution.old}</div>
                    <div className="text-xs text-muted-foreground">Old ({walletAgeMetrics.old}%)</div>
                    <div className="text-xs text-purple-400 mt-1">≥ 6 months</div>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-[#1A1F2C] rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Tracked</div>
                  <div className="text-lg font-semibold">{totalHolders.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-[#1A1F2C] rounded-lg">
                  <div className="text-sm text-muted-foreground">Net Change</div>
                  <div className={`text-lg font-semibold ${isPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
                    {isPositive ? '+' : ''}{holderIncrease}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Chart */}
        <div className={`${isExpanded ? 'w-full flex-1' : 'w-[45%] h-full'} flex items-center pt-4`}>
          <ResponsiveContainer width="100%" height={isExpanded ? '100%' : '90%'}>
            <LineChart 
              data={chartData}
              margin={{ top: 10, right: 5, left: 5, bottom: -10 }}
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
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ 
                    color: '#666666',
                    fontWeight: 'bold',
                    marginBottom: '8px'
                  }}
                  formatter={(value: any) => [
                    <span key="value" style={{ color: '#B0B0B0' }}>
                      {value.toLocaleString()} holders
                    </span>,
                    'Holders'
                  ]}
                  labelFormatter={(label) => `Time: ${label}`}
                />
              )}
              <Line 
                type="monotone"
                dataKey="value"
                stroke="#B0B0B0"
                strokeWidth={2}
                dot={isExpanded ? { 
                  stroke: '#B0B0B0', 
                  strokeWidth: 2, 
                  r: 3, 
                  fill: '#0A0A0A' 
                } : false}
                activeDot={isExpanded ? { 
                  r: 6, 
                  stroke: '#2ECC71', 
                  strokeWidth: 2, 
                  fill: '#0A0A0A' 
                } : false}
                animationDuration={300}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Status Indicator */}
      {!historyData.length && (
        <div className="absolute bottom-2 right-2">
          <div className="text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
            Using sample data
          </div>
        </div>
      )}
    </div>
  );
};

export default HoldersGraphCard;