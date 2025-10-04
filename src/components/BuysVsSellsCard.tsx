import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Pencil, RefreshCw } from 'lucide-react';
import TimeframeSelector, { Timeframe } from './TimeframeSelector';
import EditModal from './EditModal';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface BuysVsSellsCardProps {
  isExpanded: boolean;
  isLayoutMode: boolean;
  data?: {
    current: {
      buyVolume: number;
      sellVolume: number;
      netVolume: number;
      buyCount: number;
      sellCount: number;
      lastUpdated: string;
    };
    history: Array<{
      timestamp: string;
      time: string;
      buyVolume: number;
      sellVolume: number;
      netVolume: number;
      buyCount: number;
      sellCount: number;
    }>;
  };
}

const BuysVsSellsCard = ({ isExpanded = false, isLayoutMode = false, data }: BuysVsSellsCardProps) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [buysThreshold, setBuysThreshold] = useState('10');
  const [netFlipAlert, setNetFlipAlert] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use real data from props
  const currentData = data?.current || {
    buyVolume: 0,
    sellVolume: 0,
    netVolume: 0,
    buyCount: 0,
    sellCount: 0,
    lastUpdated: ''
  };

  const historyData = data?.history || [];

  const { buyVolume, sellVolume, netVolume, buyCount, sellCount, lastUpdated } = currentData;
  const isNetPositive = netVolume >= 0;

  // Format volume for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(1)}K`;
    } else {
      return `$${Math.round(volume)}`;
    }
  };

  const formatNetVolume = (volume: number) => {
    const prefix = volume >= 0 ? '+' : '';
    if (Math.abs(volume) >= 1000000) {
      return `${prefix}$${(Math.abs(volume) / 1000000).toFixed(1)}M`;
    } else if (Math.abs(volume) >= 1000) {
      return `${prefix}$${(Math.abs(volume) / 1000).toFixed(1)}K`;
    } else {
      return `${prefix}$${Math.round(Math.abs(volume))}`;
    }
  };

  // Process chart data based on timeframe and real data
  const chartData = useMemo(() => {
    if (!historyData.length) {
      // Fallback to mock data if no real data
      const mockData = [];
      const timeLabels = isExpanded
        ? ['1d', '6h', '12h', '18h', '24h', '6h', '12h', '18h', '24h', '6h', '12h', 'Now']
        : ['12h', '18h', '24h', '6h', '12h', 'Now'];
      
      const buysMultiplier = timeframe === '5m' ? 40 : timeframe === '15m' ? 50 : 60;
      const sellsMultiplier = timeframe === '5m' ? 25 : timeframe === '15m' ? 30 : 35;
      
      for (let i = 0; i < timeLabels.length; i++) {
        const buys = Math.floor(Math.random() * 30 + buysMultiplier);
        const sells = -(Math.floor(Math.random() * 20 + sellsMultiplier));
        mockData.push({ 
          time: timeLabels[i],
          buys,
          sells
        });
      }
      return mockData;
    }

    // Use real historical data
    const data = [...historyData];
    
    // Filter based on timeframe
    let filteredData;
    switch (timeframe) {
      case '5m':
        filteredData = data.slice(-15);
        break;
      case '15m':
        filteredData = data.slice(-20);
        break;
      case '1h':
        filteredData = data.slice(-25);
        break;
      default:
        filteredData = data;
    }

    // Transform data for mirror chart - scale values appropriately
    return filteredData.map(item => ({
      time: item.time,
      buys: Math.max(0, item.buyVolume / 100), // Scale down for chart
      sells: -Math.max(0, item.sellVolume / 100), // Negative values for bottom half
      actualBuyVolume: item.buyVolume,
      actualSellVolume: item.sellVolume,
      netVolume: item.netVolume
    }));
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

  // Calculate additional metrics for expanded view
  const additionalMetrics = useMemo(() => {
    const totalVolume = buyVolume + Math.abs(sellVolume);
    const buyPercentage = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 0;
    const sellPercentage = totalVolume > 0 ? (Math.abs(sellVolume) / totalVolume) * 100 : 0;
    const totalTransactions = buyCount + sellCount;
    const buyRatio = totalTransactions > 0 ? (buyCount / totalTransactions) * 100 : 0;
    const sellRatio = totalTransactions > 0 ? (sellCount / totalTransactions) * 100 : 0;

    return {
      buyPercentage: Math.round(buyPercentage),
      sellPercentage: Math.round(sellPercentage),
      buyRatio: Math.round(buyRatio),
      sellRatio: Math.round(sellRatio),
      totalVolume,
      totalTransactions
    };
  }, [buyVolume, sellVolume, buyCount, sellCount]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    // This would typically trigger a data refetch from the parent
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const buyData = payload.find((p: any) => p.dataKey === 'buys');
      const sellData = payload.find((p: any) => p.dataKey === 'sells');
      
      return (
        <div className="bg-[#0A0A0A] border border-[#2ECC71] rounded-lg p-3 shadow-lg">
          <p className="text-[#666666] font-semibold mb-2">Time: {label}</p>
          {buyData && (
            <p className="text-[#2ECC71] text-sm">
              Buys: {formatVolume(buyData.payload.actualBuyVolume || (buyData.value * 100))}
            </p>
          )}
          {sellData && (
            <p className="text-[#E74C3C] text-sm">
              Sells: {formatVolume(sellData.payload.actualSellVolume || (Math.abs(sellData.value) * 100))}
            </p>
          )}
          {buyData && sellData && (
            <p className={`text-sm mt-1 ${netVolume >= 0 ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
              Net: {formatNetVolume(buyData.payload.netVolume || ((buyData.value + Math.abs(sellData.value)) * 100 * (netVolume >= 0 ? 1 : -1)))}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="border border-[hsl(var(--dashboard-border))] rounded-2xl p-3 h-full transition-all duration-300 hover:scale-[1.01] flex flex-col overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #0D0D0D 0%, #121212 100%)'
      }}
    >
      {/* Edit Button & Timeframe Selector */}
      {!isLayoutMode && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
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
        title="Edit Buys vs Sells Alerts"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="buys-threshold" className="text-sm text-muted-foreground">
              Alert if buys exceed sells by (%)
            </Label>
            <Input
              id="buys-threshold"
              type="number"
              value={buysThreshold}
              onChange={(e) => setBuysThreshold(e.target.value)}
              className="mt-2 bg-[#1A1F2C] border-[#1E1E1E]"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Input
              id="net-flip"
              type="checkbox"
              checked={netFlipAlert}
              onChange={(e) => setNetFlipAlert(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="net-flip" className="text-sm text-muted-foreground">
              Alert on net flip to negative
            </Label>
          </div>
          <Button className="w-full" onClick={() => { setIsSaved(true); setIsEditOpen(false); }}>
            Save Changes
          </Button>
        </div>
      </EditModal>

      {isExpanded && (
        <div className="mb-4">
          <h3 className="text-foreground text-lg font-semibold">Transaction Activity</h3>
          <p className="text-muted-foreground text-xs mt-1">
            Extended buy/sell analysis • Updated {formatLastUpdated(lastUpdated)}
          </p>
        </div>
      )}
      
      <div className={`flex ${isExpanded ? 'flex-col' : 'items-center'} gap-5 flex-1 min-h-0`}>
        {/* Stat boxes */}
        <div className={`flex ${isExpanded ? 'flex-row justify-around w-full' : 'flex-col justify-center'} gap-3 ${isExpanded ? '' : 'min-w-[140px]'}`}>
          {/* Buys Box */}
          <div 
            className="rounded-lg p-3"
            style={{ background: '#102B1A' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#2ECC71]" />
              <span className="text-xs font-medium text-[#2ECC71]/70">Buys</span>
            </div>
            <div className="text-[#2ECC71] font-bold text-xl">
              {formatVolume(buyVolume)}
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              {buyCount} transactions
            </div>
          </div>

          {/* Net Box */}
          <div 
            className="rounded-lg p-3"
            style={{ background: '#1A1A1A' }}
          >
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Net
            </div>
            <div className={`font-bold text-2xl ${isNetPositive ? 'text-[#2ECC71]' : 'text-[#E74C3C]'}`}>
              {formatNetVolume(netVolume)}
            </div>
          </div>

          {/* Sells Box */}
          <div 
            className="rounded-lg p-3"
            style={{ background: '#2B1010' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-[#E74C3C]" />
              <span className="text-xs font-medium text-[#E74C3C]/70">Sells</span>
            </div>
            <div className="text-[#E74C3C] font-bold text-xl">
              {formatVolume(Math.abs(sellVolume))}
            </div>
            <div className="text-muted-foreground text-xs mt-1">
              {sellCount} transactions
            </div>
          </div>
        </div>

        {/* Additional metrics in expanded view */}
        {isExpanded && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[#1A1F2C] rounded-lg">
              <div className="text-sm text-muted-foreground">Buy Dominance</div>
              <div className="text-lg font-semibold text-[#2ECC71]">
                {additionalMetrics.buyPercentage}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {additionalMetrics.buyRatio}% of transactions
              </div>
            </div>
            <div className="p-3 bg-[#1A1F2C] rounded-lg">
              <div className="text-sm text-muted-foreground">Total Volume</div>
              <div className="text-lg font-semibold">
                {formatVolume(additionalMetrics.totalVolume)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {additionalMetrics.totalTransactions} total tx
              </div>
            </div>
          </div>
        )}

        {/* Mirror Chart */}
        <div className={`${isExpanded ? 'w-full flex-1 min-h-0' : 'flex-1 h-full'} flex items-center overflow-hidden`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
            >
              <XAxis 
                dataKey="time"
                stroke="#333333"
                tick={{ fill: '#666666', fontSize: 10 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
                tickMargin={8}
              />
              <YAxis 
                stroke="#333333"
                tick={{ fill: '#666666', fontSize: 10 }}
                tickLine={{ stroke: '#333333' }}
                axisLine={{ stroke: '#333333' }}
                domain={[-80, 80]}
                ticks={[-80, -40, 0, 40, 80]}
                tickFormatter={(value) => value >= 0 ? `$${value}` : `$${Math.abs(value)}`}
              />
              {isExpanded && <Tooltip content={<CustomTooltip />} />}
              <ReferenceLine y={0} stroke="#333333" strokeWidth={1} />
              {/* Buys Line (top half) */}
              <Line 
                type="monotone"
                dataKey="buys"
                stroke="#2ECC71"
                strokeWidth={2}
                dot={isExpanded ? { 
                  stroke: '#2ECC71', 
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
              {/* Sells Line (bottom half - negative values) */}
              <Line 
                type="monotone"
                dataKey="sells"
                stroke="#E74C3C"
                strokeWidth={2}
                dot={isExpanded ? { 
                  stroke: '#E74C3C', 
                  strokeWidth: 2, 
                  r: 3, 
                  fill: '#0A0A0A' 
                } : false}
                activeDot={isExpanded ? { 
                  r: 6, 
                  stroke: '#E74C3C', 
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

export default BuysVsSellsCard;